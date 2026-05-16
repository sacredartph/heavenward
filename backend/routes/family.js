// Family routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth, requireParent } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const family = db.prepare('SELECT id,name,patron_saint_slug,country_code,created_at FROM families WHERE id = ?').get(req.user.family_id);
  return res.json({ family });
});

router.get('/members', requireAuth, (req, res) => {
  const members = db.prepare('SELECT id,email,display_name,role,age_tier,patron_saint_slug,vocation,streak_days,last_activity_date FROM users WHERE family_id = ? ORDER BY CASE role WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END, id')
    .all(req.user.family_id, 'tatay', 'nanay');
  return res.json({ members });
});

router.put('/member/:id', requireParent, (req, res) => {
  const id = Number(req.params.id);
  const target = db.prepare('SELECT id,family_id FROM users WHERE id = ?').get(id);
  if (!target || target.family_id !== req.user.family_id) return res.status(404).json({ error: 'member not found' });
  const fields = ['display_name', 'role', 'patron_saint_slug', 'confirmation_name', 'date_of_birth', 'baptism_date', 'first_communion_date', 'confirmation_date', 'vocation'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) {
      updates.push(f + ' = ?');
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'nothing to update' });
  values.push(id);
  db.prepare('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?').run(...values);
  return res.json({ ok: true });
});

router.get('/milestones', requireAuth, (req, res) => {
  const ms = db.prepare('SELECT * FROM family_milestones WHERE family_id = ? ORDER BY milestone_date').all(req.user.family_id);
  return res.json({ milestones: ms });
});

router.post('/milestone', requireParent, (req, res) => {
  const { member_user_id, type, milestone_date, notes, annual } = req.body || {};
  if (!type || !milestone_date) return res.status(400).json({ error: 'type and milestone_date required' });
  const r = db.prepare('INSERT INTO family_milestones (family_id,member_user_id,type,milestone_date,notes,annual) VALUES (?,?,?,?,?,?)')
    .run(req.user.family_id, member_user_id || null, type, milestone_date, notes || null, annual ? 1 : 0);
  return res.json({ id: r.lastInsertRowid });
});

module.exports = router;
