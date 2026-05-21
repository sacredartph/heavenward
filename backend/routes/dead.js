// Repository of the Dead - the family's quiet book.
const express = require('express');
const db = require('../models/db');
const { requireAuth, requireParent } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM repository_of_dead WHERE family_id = ? ORDER BY is_family_patron DESC, full_name`).all(req.user.family_id);
  return res.json({ dead: rows });
});

router.post('/', requireParent, (req, res) => {
  const { full_name, nickname, relationship, birthdate, death_date, baptism_date, brief_story, photo_placeholder_color } = req.body || {};
  if (!full_name) return res.status(400).json({ error: 'full_name required' });
  const r = db.prepare(`INSERT INTO repository_of_dead (family_id,added_by_user_id,full_name,nickname,relationship,birthdate,death_date,baptism_date,brief_story,photo_placeholder_color) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.family_id, req.user.id, full_name, nickname || null, relationship || null, birthdate || null, death_date || null, baptism_date || null, brief_story || null, photo_placeholder_color || '#C9A84C');
  return res.json({ id: r.lastInsertRowid });
});

router.post('/:id/candle', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const person = db.prepare('SELECT id,family_id FROM repository_of_dead WHERE id = ?').get(id);
  if (!person || person.family_id !== req.user.family_id) return res.status(404).json({ error: 'person not found' });
  const r = db.prepare('INSERT INTO hearth_candles (family_id,user_id,repository_person_id) VALUES (?,?,?)').run(req.user.family_id, req.user.id, id);
  return res.json({ id: r.lastInsertRowid });
});

// Candles burn for 24 hours from the moment they are lit, not "until midnight."
// A candle lit at 11pm gets its full overnight rather than going dark at 00:01.
// This is the only "today" surface in Heavenward that uses a rolling 24h window;
// rosaries, hours, offerings, and examens still roll over on calendar PHT midnight
// so they line up with the liturgy of the day.
router.get('/candles/today', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT c.id,c.lit_at,c.user_id,u.display_name AS lit_by,d.full_name,d.nickname
    FROM hearth_candles c
    JOIN repository_of_dead d ON d.id = c.repository_person_id
    JOIN users u ON u.id = c.user_id
    WHERE c.family_id = ? AND c.lit_at >= datetime('now','-24 hours')
    ORDER BY c.lit_at DESC`).all(req.user.family_id);
  return res.json({ candles: rows });
});

// Remove a person from the Book of Life. Parents only - this is the family ledger.
router.delete('/:id', requireParent, (req, res) => {
  const id = Number(req.params.id);
  const person = db.prepare('SELECT id, family_id FROM repository_of_dead WHERE id = ?').get(id);
  if (!person || person.family_id !== req.user.family_id) return res.status(404).json({ error: 'not found' });
  db.prepare('DELETE FROM hearth_candles WHERE repository_person_id = ?').run(id);
  db.prepare('DELETE FROM repository_of_dead WHERE id = ?').run(id);
  return res.json({ ok: true });
});

module.exports = router;
