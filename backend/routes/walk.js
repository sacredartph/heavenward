// The Walk - Rosary + Pilgrim (Camino + Saint Walk) routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Idempotent ensure: log of every completed Camino / Saint Walk, so the picker
// can rotate variety per user and skip people you've already walked-for in the
// last 24h. Rosary walks live in rosary_walks; this table is just for pilgrims.
db.prepare(`CREATE TABLE IF NOT EXISTS pilgrim_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  family_id INTEGER NOT NULL,
  mode TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  steps INTEGER DEFAULT 0,
  walked_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_pilgrim_user_time ON pilgrim_log (user_id, walked_at DESC)').run();

const SETS_BY_DOW = ['glorious', 'joyful', 'sorrowful', 'glorious', 'luminous', 'sorrowful', 'joyful'];

function setForToday(d) {
  return SETS_BY_DOW[(d || new Date()).getDay()];
}

router.get('/today', requireAuth, (req, res) => {
  const set = setForToday();
  const mysteries = db.prepare('SELECT id,mystery_number,mystery_name,scripture_ref,reflection,decade_question FROM rosary_mysteries WHERE set_name = ? ORDER BY mystery_number').all(set);
  const lastWalk = db.prepare('SELECT id,started_at,ended_at,decades_completed,mode FROM rosary_walks WHERE user_id = ? ORDER BY started_at DESC LIMIT 1').get(req.user.id);
  return res.json({ mystery_set: set, mysteries, last_walk: lastWalk });
});

router.post('/start', requireAuth, (req, res) => {
  const mode = (req.body && req.body.mode) === 'family' ? 'family' : 'solo';
  const set = (req.body && req.body.mystery_set) || setForToday();
  const r = db.prepare('INSERT INTO rosary_walks (user_id,family_id,mode,mystery_set,started_at,initiated_by) VALUES (?,?,?,?,CURRENT_TIMESTAMP,?)')
    .run(req.user.id, req.user.family_id, mode, set, req.user.id);
  const walkId = r.lastInsertRowid;
  db.prepare('INSERT INTO rosary_participants (walk_id,user_id) VALUES (?,?)').run(walkId, req.user.id);
  return res.json({ walk_id: walkId, mystery_set: set, mode });
});

router.post('/:id/join', requireAuth, (req, res) => {
  const walkId = Number(req.params.id);
  const walk = db.prepare('SELECT id,family_id,mode FROM rosary_walks WHERE id = ?').get(walkId);
  if (!walk || walk.family_id !== req.user.family_id) return res.status(404).json({ error: 'walk not found' });
  const exists = db.prepare('SELECT id FROM rosary_participants WHERE walk_id = ? AND user_id = ?').get(walkId, req.user.id);
  if (!exists) db.prepare('INSERT INTO rosary_participants (walk_id,user_id) VALUES (?,?)').run(walkId, req.user.id);
  return res.json({ ok: true });
});

router.put('/:id/advance', requireAuth, (req, res) => {
  const walkId = Number(req.params.id);
  const { decades_completed, steps } = req.body || {};
  const walk = db.prepare('SELECT id,user_id FROM rosary_walks WHERE id = ?').get(walkId);
  if (!walk) return res.status(404).json({ error: 'walk not found' });
  db.prepare('UPDATE rosary_walks SET decades_completed = COALESCE(?,decades_completed), steps = COALESCE(?,steps) WHERE id = ?')
    .run(typeof decades_completed === 'number' ? decades_completed : null, typeof steps === 'number' ? steps : null, walkId);
  return res.json({ ok: true });
});

router.post('/:id/complete', requireAuth, (req, res) => {
  const walkId = Number(req.params.id);
  const { steps, decades_completed, tail_completed } = req.body || {};
  const walk = db.prepare('SELECT id,started_at FROM rosary_walks WHERE id = ?').get(walkId);
  if (!walk) return res.status(404).json({ error: 'walk not found' });
  const started = new Date(walk.started_at + 'Z');
  const duration = Math.max(0, Math.round((Date.now() - started.getTime()) / 1000));
  db.prepare('UPDATE rosary_walks SET ended_at = CURRENT_TIMESTAMP, duration_seconds = ?, steps = ?, decades_completed = ?, tail_completed = ? WHERE id = ?')
    .run(duration, steps || 0, decades_completed || 5, tail_completed ? 1 : 0, walkId);
  // log to hours_log so the rosary counts as a prayer "hour"
  db.prepare('INSERT INTO hours_log (user_id,hour_type,duration_seconds) VALUES (?,?,?)').run(req.user.id, 'rosary', duration);
  // increment streak (one walk per day counts)
  const today = new Date().toISOString().slice(0, 10);
  const last = db.prepare('SELECT last_activity_date,streak_days FROM users WHERE id = ?').get(req.user.id);
  let newStreak = (last && last.streak_days) || 0;
  if (last && last.last_activity_date === today) {
    // same day, no change
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    newStreak = last && last.last_activity_date === yesterday ? newStreak + 1 : 1;
    db.prepare('UPDATE users SET streak_days = ?, last_activity_date = ? WHERE id = ?').run(newStreak, today, req.user.id);
  }
  return res.json({ ok: true, duration_seconds: duration, streak_days: newStreak });
});

// Named Rosary intentions: deterministic 50-name roster for today.
// Pulls from emergency petitions (always), then weighted across petitions, sick, Book of Life, and Our People.
// Same family, same day = same 50 names in the same order, so all devices line up bead-for-bead.
router.get('/intentions', requireAuth, (req, res) => {
  const familyId = req.user.family_id;
  const today = new Date().toISOString().slice(0, 10);

  const petitions = db.prepare('SELECT id, person_name, petition, level FROM prayer_petitions WHERE family_id = ? AND status = ? ORDER BY level, date_added').all(familyId, 'active');
  const sick      = db.prepare('SELECT id, person_name, intention FROM prayer_sick WHERE family_id = ? AND status = ?').all(familyId, 'active');
  const dead      = db.prepare('SELECT id, full_name, relationship FROM repository_of_dead WHERE family_id = ?').all(familyId);
  const people    = db.prepare('SELECT id, full_name, relationship, category FROM prayer_people WHERE family_id = ? AND active = 1').all(familyId);

  // Each pool item -> intention { name, intention, source, source_id }
  const fmt = (name, intention, source, source_id) => ({ name, intention: intention || null, source, source_id });
  const emergency = petitions.filter(p => p.level === 1).map(p => fmt(p.person_name || 'Emergency', p.petition, 'petition_emergency', p.id));
  const urgent    = petitions.filter(p => p.level === 2).map(p => fmt(p.person_name || 'Urgent', p.petition, 'petition_urgent', p.id));
  const active    = petitions.filter(p => p.level >= 3).map(p => fmt(p.person_name || 'Intention', p.petition, 'petition', p.id));
  const sickIntents = sick.map(s => fmt(s.person_name, s.intention, 'sick', s.id));
  const deadIntents = dead.map(d => fmt(d.full_name, 'in your mercy', 'dead', d.id));
  const peopleIntents = people.map(p => fmt(p.full_name, p.relationship || null, 'people', p.id));

  // Deterministic shuffle based on (familyId + today). Same inputs -> same order.
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    // Mulberry32 PRNG
    let t = seed >>> 0;
    for (let i = a.length - 1; i > 0; i--) {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      const j = ((r ^ (r >>> 14)) >>> 0) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const seed = familyId * 100000 + Number(today.replace(/-/g, ''));

  // Build the 50-name roster.
  // Always-include: emergency + urgent (up to 12 slots combined). Then fill from a weighted shuffle of the rest.
  const alwaysInclude = []
    .concat(emergency)
    .concat(urgent.slice(0, Math.max(0, 12 - emergency.length)));
  const remainingSlots = Math.max(0, 50 - alwaysInclude.length);

  const restPool = []
    .concat(active)
    .concat(sickIntents)
    .concat(deadIntents)
    .concat(peopleIntents);

  const shuffled = seededShuffle(restPool, seed);
  const rest = [];
  if (shuffled.length === 0) {
    // No prayer circle yet - synthesize gentle placeholders so the rosary still names something.
    const placeholders = [
      { name: 'Our family',        intention: null, source: 'placeholder' },
      { name: 'Our parish',        intention: null, source: 'placeholder' },
      { name: 'The Pope Leo XIV',  intention: null, source: 'placeholder' },
      { name: 'Our country',       intention: null, source: 'placeholder' },
      { name: 'Those who have no one to pray for them', intention: null, source: 'placeholder' }
    ];
    for (let i = 0; i < remainingSlots; i++) rest.push(placeholders[i % placeholders.length]);
  } else {
    for (let i = 0; i < remainingSlots; i++) rest.push(shuffled[i % shuffled.length]);
  }
  const roster = alwaysInclude.concat(rest).slice(0, 50);

  return res.json({
    date: today,
    family_id: familyId,
    total_in_circle: petitions.length + sick.length + dead.length + people.length,
    roster
  });
});

router.get('/tail', requireAuth, (req, res) => {
  const familyId = req.user.family_id;
  const dead = db.prepare('SELECT id,full_name,nickname,relationship FROM repository_of_dead WHERE family_id = ? ORDER BY is_family_patron DESC, full_name').all(familyId);
  const sick = db.prepare('SELECT id,person_name,intention,relationship FROM prayer_sick WHERE family_id = ? AND status = ? ORDER BY date_added').all(familyId, 'active');
  const petitions = db.prepare('SELECT id,person_name,petition,level FROM prayer_petitions WHERE family_id = ? AND status = ? ORDER BY level, is_pinned DESC, date_added').all(familyId, 'active');
  const thanksgiving = db.prepare('SELECT id,person_name,thanksgiving_text FROM prayer_thanksgiving WHERE family_id = ? ORDER BY date_added DESC LIMIT 10').all(familyId);
  return res.json({
    dead, sick, petitions, thanksgiving,
    church: { pope: 'Pope Leo XIV', petitions: ['for the Church', 'for the Philippines', 'for Pope Leo XIV', 'for all priests and religious'] }
  });
});

// ----- Pilgrim (Camino + Saint Walk) log -----
// Record a completed pilgrim walk so the picker can avoid offering the same
// person again within 24h, and so the Hearth has a clean record per user.
router.post('/pilgrim', requireAuth, (req, res) => {
  const { mode, recipient, steps } = req.body || {};
  if (mode !== 'camino' && mode !== 'saint') return res.status(400).json({ error: "mode must be 'camino' or 'saint'" });
  const rn = String(recipient || '').trim();
  if (!rn) return res.status(400).json({ error: 'recipient required' });
  const r = db.prepare(
    'INSERT INTO pilgrim_log (user_id, family_id, mode, recipient_name, steps) VALUES (?,?,?,?,?)'
  ).run(req.user.id, req.user.family_id, mode, rn.slice(0, 200), Number(steps) || 0);
  return res.json({ id: r.lastInsertRowid, ok: true });
});

// Recent Camino recipients for THIS user, used by the picker to exclude
// people already walked-for in the last N hours (default 24h).
router.get('/pilgrim/recent', requireAuth, (req, res) => {
  const hours = Math.min(168, Math.max(1, Number(req.query.hours) || 24));
  const rows = db.prepare(
    "SELECT DISTINCT recipient_name FROM pilgrim_log WHERE user_id = ? AND mode = 'camino' AND walked_at >= datetime('now', ?) ORDER BY recipient_name"
  ).all(req.user.id, '-' + hours + ' hours');
  return res.json({ hours, recipients: rows.map(r => r.recipient_name) });
});

module.exports = router;
