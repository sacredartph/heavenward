// The Hearth - family feed, posts, presence, candle visibility.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/feed', requireAuth, (req, res) => {
  const posts = db.prepare(`SELECT p.*, u.display_name AS author
    FROM hearth_posts p JOIN users u ON u.id = p.user_id
    WHERE p.family_id = ?
    ORDER BY p.created_at DESC LIMIT 100`).all(req.user.family_id);
  return res.json({ feed: posts });
});

router.post('/post', requireAuth, (req, res) => {
  const { type, content } = req.body || {};
  const allowed = ['offering', 'note', 'examen_done', 'prayed_for', 'request'];
  const t = allowed.includes(type) ? type : 'note';
  const r = db.prepare('INSERT INTO hearth_posts (family_id,user_id,type,content) VALUES (?,?,?,?)')
    .run(req.user.family_id, req.user.id, t, content || null);
  return res.json({ id: r.lastInsertRowid });
});

router.get('/presence', requireAuth, (req, res) => {
  const members = db.prepare(`SELECT u.id,u.display_name,u.role,u.age_tier,u.streak_days,u.last_activity_date,u.patron_saint_slug,
    (SELECT COUNT(*) FROM rosary_walks rw WHERE rw.user_id = u.id AND date(rw.started_at,'+8 hours') = date('now','+8 hours')) AS rosaries_today,
    (SELECT COUNT(*) FROM hours_log hl WHERE hl.user_id = u.id AND date(hl.logged_at,'+8 hours') = date('now','+8 hours')) AS hours_today,
    (SELECT SUM(rw.steps) FROM rosary_walks rw WHERE rw.user_id = u.id AND date(rw.started_at,'+8 hours') = date('now','+8 hours')) AS steps_today,
    (SELECT COUNT(*) FROM hours_log hl WHERE hl.user_id = u.id AND hl.hour_type = 'morning_offering' AND date(hl.logged_at,'+8 hours') = date('now','+8 hours')) AS today_offered,
    (SELECT moment_type FROM moment_log ml WHERE ml.user_id = u.id AND date(ml.logged_at,'+8 hours') = date('now','+8 hours') ORDER BY ml.logged_at DESC LIMIT 1) AS last_moment,
    (SELECT MAX(t) FROM (
       SELECT MAX(logged_at) AS t FROM hours_log WHERE user_id = u.id
       UNION ALL SELECT MAX(logged_at) FROM moment_log WHERE user_id = u.id
       UNION ALL SELECT MAX(started_at) FROM rosary_walks WHERE user_id = u.id AND ended_at IS NULL
    )) AS last_active_at
    FROM users u WHERE u.family_id = ? ORDER BY CASE u.role WHEN 'tatay' THEN 0 WHEN 'nanay' THEN 1 ELSE 2 END, u.id`)
    .all(req.user.family_id);

  // is_active_now: any prayer activity in the last 120 seconds (and any open rosary walk is always "now").
  const now = Date.now();
  for (const m of members) {
    let activeNow = false;
    if (m.last_active_at) {
      const lastTs = new Date(m.last_active_at + 'Z').getTime();
      if (!isNaN(lastTs) && (now - lastTs) < 120 * 1000) activeNow = true;
    }
    m.is_active_now = activeNow ? 1 : 0;
  }

  const nowDate = new Date();
  members.forEach(m => {
    if (!m.last_activity_date) { m.status = 'dim'; return; }
    const last = new Date(m.last_activity_date);
    const diffMins = (nowDate - last) / 60000;
    const diffDays = (nowDate - last) / 86400000;
    if (diffMins < 15) m.status = 'now';
    else if (diffDays < 1) m.status = 'today';
    else if (diffDays < 2) m.status = 'yesterday';
    else m.status = 'dim';
  });

  // Candles use a 24h rolling window (not calendar-day) so a candle lit at 11pm
  // burns through the night instead of going dark at midnight.
  const candles_today = db.prepare(`SELECT d.full_name, COUNT(*) c FROM hearth_candles ch JOIN repository_of_dead d ON d.id = ch.repository_person_id WHERE ch.family_id = ? AND ch.lit_at >= datetime('now','-24 hours') GROUP BY d.full_name`).all(req.user.family_id);

  const isChild = req.user.role === 'child';
  const filtered = members.map(m => {
    if (isChild && m.id !== req.user.id) {
      return { id: m.id, display_name: m.display_name, role: m.role, status: m.status, streak_days: m.streak_days };
    }
    return m;
  });
  return res.json({ members: filtered, candles_today });
});

// ====================================================================
// Hearth design v2: rollup sentence + acts ticker + gesture endpoints.
// ====================================================================

// One-sentence rollup of what the family has given to the Church today.
router.get('/rollup', requireAuth, (req, res) => {
  const f = req.user.family_id;
  const candles  = db.prepare(`SELECT COUNT(*) c FROM hearth_candles WHERE family_id = ? AND lit_at >= datetime('now','-24 hours')`).get(f).c;
  const rosaries = db.prepare(`SELECT COUNT(*) c FROM rosary_walks WHERE family_id = ? AND date(started_at,'+8 hours') = date('now','+8 hours') AND ended_at IS NOT NULL`).get(f).c;
  const offerings = db.prepare(`SELECT COUNT(*) c FROM hours_log h JOIN users u ON u.id = h.user_id WHERE u.family_id = ? AND h.hour_type = 'morning_offering' AND date(h.logged_at,'+8 hours') = date('now','+8 hours')`).get(f).c;
  const examens  = db.prepare(`SELECT COUNT(*) c FROM hours_log h JOIN users u ON u.id = h.user_id WHERE u.family_id = ? AND h.hour_type = 'examen' AND date(h.logged_at,'+8 hours') = date('now','+8 hours')`).get(f).c;
  const angelus  = db.prepare(`SELECT COUNT(*) c FROM hours_log h JOIN users u ON u.id = h.user_id WHERE u.family_id = ? AND h.hour_type = 'angelus' AND date(h.logged_at,'+8 hours') = date('now','+8 hours')`).get(f).c;
  const intercessions = db.prepare(`SELECT COUNT(*) c FROM hearth_posts WHERE family_id = ? AND date(created_at,'+8 hours') = date('now','+8 hours') AND content LIKE '%asked%'`).get(f).c;

  // Compose one Catholic-family sentence.
  const parts = [];
  if (candles)  parts.push(candles + ' candle'   + (candles === 1 ? '' : 's')   + ' lit');
  if (rosaries) parts.push(rosaries + ' rosar'   + (rosaries === 1 ? 'y' : 'ies') + ' walked');
  if (offerings) parts.push('the day offered ' + offerings + ' time' + (offerings === 1 ? '' : 's'));
  if (angelus)  parts.push('the Angelus prayed ' + angelus + ' time' + (angelus === 1 ? '' : 's'));
  if (intercessions) parts.push(intercessions + ' saint' + (intercessions === 1 ? '' : 's') + ' asked');
  if (examens)  parts.push(examens + ' examen' + (examens === 1 ? '' : 's'));

  let sentence;
  if (!parts.length) {
    sentence = 'The day is young. What will our family give him today?';
  } else if (parts.length === 1) {
    sentence = 'Today our family has ' + parts[0] + '.';
  } else {
    sentence = 'Today our family has ' + parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1] + '.';
  }
  return res.json({ sentence, counts: { candles, rosaries, offerings, examens, angelus, intercessions } });
});

// Recent acts of the family - for the rotating ticker. Pulled from hearth_posts + candles + hours.
router.get('/acts', requireAuth, (req, res) => {
  const f = req.user.family_id;
  const rows = [];

  const posts = db.prepare(`SELECT p.created_at, u.display_name AS author, p.content
    FROM hearth_posts p JOIN users u ON u.id = p.user_id
    WHERE p.family_id = ? AND date(p.created_at,'+8 hours') = date('now','+8 hours') ORDER BY p.created_at DESC LIMIT 30`).all(f);
  for (const p of posts) {
    if (!p.content) continue;
    rows.push({ at: p.created_at, text: p.content });
  }

  const candles = db.prepare(`SELECT c.lit_at, u.display_name AS lit_by, d.full_name
    FROM hearth_candles c JOIN repository_of_dead d ON d.id = c.repository_person_id
    JOIN users u ON u.id = c.user_id
    WHERE c.family_id = ? AND c.lit_at >= datetime('now','-24 hours') ORDER BY c.lit_at DESC LIMIT 30`).all(f);
  for (const c of candles) rows.push({ at: c.lit_at, text: c.lit_by + ' lit a candle for ' + c.full_name + '.' });

  const hours = db.prepare(`SELECT h.logged_at, u.display_name AS user_name, h.hour_type
    FROM hours_log h JOIN users u ON u.id = h.user_id
    WHERE u.family_id = ? AND date(h.logged_at,'+8 hours') = date('now','+8 hours') ORDER BY h.logged_at DESC LIMIT 30`).all(f);
  const hourLabel = { morning_offering: 'offered the day', examen: 'examined the day', angelus: 'prayed the Angelus', rosary: 'walked the Rosary', reading: 'sat with the Word' };
  for (const h of hours) {
    const verb = hourLabel[h.hour_type];
    if (verb) rows.push({ at: h.logged_at, text: h.user_name.split(' ')[0] + ' ' + verb + '.' });
  }

  rows.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  return res.json({ acts: rows.slice(0, 12) });
});

// Gesture: pray a Hail Mary explicitly for another family member.
// Logged as a hearth post + (in future) a push notification to the target.
router.post('/gesture/hail-mary', requireAuth, (req, res) => {
  const { target_user_id } = req.body || {};
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  const target = db.prepare('SELECT id,display_name,family_id FROM users WHERE id = ? AND family_id = ?').get(target_user_id, req.user.family_id);
  if (!target) return res.status(404).json({ error: 'family member not found' });
  const content = (req.user.display_name || 'A family member').split(' ')[0] + ' is praying a Hail Mary for ' + target.display_name.split(' ')[0] + '.';
  db.prepare('INSERT INTO hearth_posts (family_id,user_id,type,content) VALUES (?,?,?,?)').run(req.user.family_id, req.user.id, 'prayed_for', content);
  return res.json({ ok: true });
});

// Gesture: send a blessing (push notification + hearth post).
router.post('/gesture/bless', requireAuth, (req, res) => {
  const { target_user_id } = req.body || {};
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  const target = db.prepare('SELECT id,display_name,family_id FROM users WHERE id = ? AND family_id = ?').get(target_user_id, req.user.family_id);
  if (!target) return res.status(404).json({ error: 'family member not found' });
  const from = (req.user.display_name || 'Family').split(' ')[0];
  const content = from + ' sent a blessing to ' + target.display_name.split(' ')[0] + '.';
  db.prepare('INSERT INTO hearth_posts (family_id,user_id,type,content) VALUES (?,?,?,?)').run(req.user.family_id, req.user.id, 'note', content);

  // Best-effort push notification to that member's devices, if VAPID is configured.
  (async () => {
    try {
      if (!process.env.VAPID_PUBLIC || !process.env.VAPID_PRIVATE) return;
      const webpush = require('web-push');
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);
      const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(target.id);
      const payload = JSON.stringify({ title: 'A blessing from ' + from, body: from + ' sent you a blessing.', url: '/' });
      for (const s of subs) {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); }
        catch (e) { if (e.statusCode === 404 || e.statusCode === 410) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id); }
      }
    } catch (e) { console.error('[blessing push]', e); }
  })();

  return res.json({ ok: true });
});

// Gesture: carry the first open petition of a family member as a co-carrier.
router.post('/gesture/carry', requireAuth, (req, res) => {
  const { target_user_id } = req.body || {};
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  const target = db.prepare('SELECT id,display_name,family_id FROM users WHERE id = ? AND family_id = ?').get(target_user_id, req.user.family_id);
  if (!target) return res.status(404).json({ error: 'family member not found' });
  const petition = db.prepare(`SELECT id,petition FROM prayer_petitions WHERE added_by_user_id = ? AND status = ? ORDER BY level, date_added LIMIT 1`).get(target.id, 'active');
  if (!petition) return res.status(404).json({ error: 'no open petitions to carry' });
  const exists = db.prepare('SELECT id FROM petition_carriers WHERE petition_id = ? AND user_id = ?').get(petition.id, req.user.id);
  if (!exists) db.prepare('INSERT INTO petition_carriers (petition_id,user_id,assigned_by_user_id) VALUES (?,?,?)').run(petition.id, req.user.id, req.user.id);
  const from = (req.user.display_name || 'Family').split(' ')[0];
  const content = from + ' is carrying ' + target.display_name.split(' ')[0] + "'s intention.";
  db.prepare('INSERT INTO hearth_posts (family_id,user_id,type,content) VALUES (?,?,?,?)').run(req.user.family_id, req.user.id, 'note', content);
  return res.json({ ok: true, petition_id: petition.id });
});

module.exports = router;
