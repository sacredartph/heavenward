// "Our People" - the family's ongoing prayer circle. Living people we pray for daily.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const CATEGORIES = ['family','friend','godfamily','parish','work','acquaintance','other'];

router.get('/', requireAuth, (req, res) => {
  const cat = req.query.category;
  let rows;
  if (cat && CATEGORIES.includes(cat)) {
    rows = db.prepare('SELECT * FROM prayer_people WHERE family_id = ? AND active = 1 AND category = ? ORDER BY full_name').all(req.user.family_id, cat);
  } else {
    rows = db.prepare('SELECT * FROM prayer_people WHERE family_id = ? AND active = 1 ORDER BY category, full_name').all(req.user.family_id);
  }
  return res.json({ people: rows, categories: CATEGORIES });
});

router.post('/', requireAuth, (req, res) => {
  const { full_name, relationship, category, notes } = req.body || {};
  if (!full_name || !String(full_name).trim()) return res.status(400).json({ error: 'full_name required' });
  const cat = CATEGORIES.includes(category) ? category : 'other';
  const r = db.prepare('INSERT INTO prayer_people (family_id,added_by_user_id,full_name,relationship,category,notes) VALUES (?,?,?,?,?,?)')
    .run(req.user.family_id, req.user.id, String(full_name).trim(), relationship || null, cat, notes || null);
  return res.json({ id: r.lastInsertRowid });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT id, family_id FROM prayer_people WHERE id = ?').get(id);
  if (!p || p.family_id !== req.user.family_id) return res.status(404).json({ error: 'person not found' });
  db.prepare('UPDATE prayer_people SET active = 0 WHERE id = ?').run(id);
  return res.json({ ok: true });
});

// Bulk import. Accepts:
//   - Plain text, one name per line.
//   - Excel paste: lines with tab-separated fields (Name [TAB] Relationship [TAB] Category).
//   - CSV: lines with comma-separated fields (Name, Relationship, Category).
// The parser auto-detects per line.
router.post('/import', requireAuth, (req, res) => {
  const { text, default_category } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'text required' });
  const defCat = CATEGORIES.includes(default_category) ? default_category : 'other';
  const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const ins = db.prepare('INSERT INTO prayer_people (family_id,added_by_user_id,full_name,relationship,category) VALUES (?,?,?,?,?)');
  const tx = db.transaction((rows) => {
    for (const row of rows) ins.run(req.user.family_id, req.user.id, row.name, row.relationship, row.category);
  });
  const parsed = [];
  for (const line of lines) {
    let parts;
    if (line.includes('\t')) parts = line.split('\t').map(s => s.trim());
    else if (line.includes(',')) parts = line.split(',').map(s => s.trim());
    else parts = [line];
    const name = parts[0];
    if (!name) continue;
    const relationship = parts[1] || null;
    let cat = (parts[2] || '').toLowerCase();
    if (!CATEGORIES.includes(cat)) cat = defCat;
    parsed.push({ name, relationship, category: cat });
  }
  if (!parsed.length) return res.status(400).json({ error: 'no names parsed' });
  tx(parsed);
  return res.json({ ok: true, added: parsed.length });
});

router.get('/summary', requireAuth, (req, res) => {
  const counts = db.prepare('SELECT category, COUNT(*) c FROM prayer_people WHERE family_id = ? AND active = 1 GROUP BY category').all(req.user.family_id);
  const total = db.prepare('SELECT COUNT(*) c FROM prayer_people WHERE family_id = ? AND active = 1').get(req.user.family_id).c;
  return res.json({ total, by_category: counts });
});

module.exports = router;
