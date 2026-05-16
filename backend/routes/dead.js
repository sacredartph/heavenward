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

router.get('/candles/today', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT c.id,c.lit_at,c.user_id,u.display_name AS lit_by,d.full_name,d.nickname
    FROM hearth_candles c
    JOIN repository_of_dead d ON d.id = c.repository_person_id
    JOIN users u ON u.id = c.user_id
    WHERE c.family_id = ? AND date(c.lit_at) = date('now')
    ORDER BY c.lit_at DESC`).all(req.user.family_id);
  return res.json({ candles: rows });
});

module.exports = router;
