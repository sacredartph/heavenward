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
  const members = db.prepare(`SELECT u.id,u.display_name,u.role,u.age_tier,u.streak_days,u.last_activity_date,
    (SELECT COUNT(*) FROM rosary_walks rw WHERE rw.user_id = u.id AND date(rw.started_at) = date('now')) AS rosaries_today,
    (SELECT COUNT(*) FROM hours_log hl WHERE hl.user_id = u.id AND date(hl.logged_at) = date('now')) AS hours_today,
    (SELECT SUM(rw.steps) FROM rosary_walks rw WHERE rw.user_id = u.id AND date(rw.started_at) = date('now')) AS steps_today,
    (SELECT COUNT(*) FROM hours_log hl WHERE hl.user_id = u.id AND hl.hour_type = 'morning_offering' AND date(hl.logged_at) = date('now')) AS today_offered,
    (SELECT moment_type FROM moment_log ml WHERE ml.user_id = u.id AND date(ml.logged_at) = date('now') ORDER BY ml.logged_at DESC LIMIT 1) AS last_moment
    FROM users u WHERE u.family_id = ? ORDER BY CASE u.role WHEN 'tatay' THEN 0 WHEN 'nanay' THEN 1 ELSE 2 END, u.id`)
    .all(req.user.family_id);

  const now = new Date();
  members.forEach(m => {
    if (!m.last_activity_date) { m.status = 'dim'; return; }
    const last = new Date(m.last_activity_date);
    const diffMins = (now - last) / 60000;
    const diffDays = (now - last) / 86400000;
    if (diffMins < 15) m.status = 'now';
    else if (diffDays < 1) m.status = 'today';
    else if (diffDays < 2) m.status = 'yesterday';
    else m.status = 'dim';
  });

  const candles_today = db.prepare(`SELECT d.full_name, COUNT(*) c FROM hearth_candles ch JOIN repository_of_dead d ON d.id = ch.repository_person_id WHERE ch.family_id = ? AND date(ch.lit_at) = date('now') GROUP BY d.full_name`).all(req.user.family_id);

  const isChild = req.user.role === 'child';
  const filtered = members.map(m => {
    if (isChild && m.id !== req.user.id) {
      return { id: m.id, display_name: m.display_name, role: m.role, status: m.status, streak_days: m.streak_days };
    }
    return m;
  });
  return res.json({ members: filtered, candles_today });
});

module.exports = router;
