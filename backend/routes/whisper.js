// Whisper routes: log a moment and surface the right whisper for it.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function pickWhisper(userId, ageTier, momentType, freeText) {
  // Find candidates whose situation_tags include the moment_type and age_tiers include the user’s tier (or 'any').
  // Prefer ones the user has NOT seen in the last 90 days.
  const all = db.prepare('SELECT * FROM whisper_library WHERE approved_by_bryan = 1').all();
  const tier = ageTier || 'adult';
  const seenIds = new Set(
    db.prepare('SELECT whisper_id FROM whisper_log WHERE user_id = ? AND shown_at > datetime(\'now\', \'-90 days\')')
      .all(userId).map(r => r.whisper_id)
  );

  const matchTier = (w) => {
    try {
      const arr = JSON.parse(w.age_tiers);
      return arr.includes(tier) || arr.includes('any');
    } catch { return true; }
  };
  const matchMoment = (w, m) => {
    if (!m) return true;
    try {
      const arr = JSON.parse(w.situation_tags);
      return arr.includes(m);
    } catch { return false; }
  };

  // Tiered selection.
  let candidates = all.filter(w => matchTier(w) && matchMoment(w, momentType) && !seenIds.has(w.id));
  if (!candidates.length) candidates = all.filter(w => matchTier(w) && matchMoment(w, momentType));
  if (!candidates.length) candidates = all.filter(w => matchTier(w));
  if (!candidates.length) candidates = all;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

router.post('/log', requireAuth, (req, res) => {
  const { moment_type, free_text } = req.body || {};
  if (moment_type) {
    db.prepare('INSERT INTO moment_log (user_id,moment_type,free_text) VALUES (?,?,?)')
      .run(req.user.id, moment_type, free_text || null);
  }
  const w = pickWhisper(req.user.id, req.user.age_tier, moment_type, free_text);
  if (!w) return res.status(404).json({ error: 'no whisper available' });
  db.prepare('INSERT INTO whisper_log (user_id,whisper_id,moment_type) VALUES (?,?,?)').run(req.user.id, w.id, moment_type || null);
  // doctrinal exposure
  try {
    const tags = JSON.parse(w.doctrinal_tags || '[]');
    const today = new Date().toISOString().slice(0, 10);
    const upsert = db.prepare(`INSERT INTO doctrinal_exposure (user_id,area,first_encountered,times_encountered,last_encountered)
      VALUES (?,?,?,1,?)
      ON CONFLICT(user_id,area) DO UPDATE SET times_encountered = times_encountered + 1, last_encountered = ?`);
    for (const t of tags) upsert.run(req.user.id, t, today, today, today);
  } catch {}
  return res.json({
    id: w.id,
    scripture: { text: w.scripture_text, ref: w.scripture_ref },
    saint: { name: w.saint_name, text: w.saint_text },
    truth: w.truth_text
  });
});

router.get('/history', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT l.id,l.shown_at,l.moment_type,w.scripture_text,w.scripture_ref,w.saint_name,w.truth_text
      FROM whisper_log l JOIN whisper_library w ON w.id = l.whisper_id
      WHERE l.user_id = ? ORDER BY l.shown_at DESC LIMIT 50`).all(req.user.id);
  return res.json({ history: rows });
});

module.exports = router;
