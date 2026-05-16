// The Walk - Rosary routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;
