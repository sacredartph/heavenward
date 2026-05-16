// Prayer ecosystem: petitions, sick, thanksgiving, inventory, carriers, events.
const express = require('express');
const db = require('../models/db');
const { requireAuth, requireParent } = require('../middleware/auth');

const router = express.Router();
const today = () => new Date().toISOString().slice(0, 10);

// PETITIONS
router.get('/petitions', requireAuth, (req, res) => {
  const status = req.query.status || 'active';
  const rows = db.prepare(`SELECT p.*, u.display_name AS added_by_name
    FROM prayer_petitions p LEFT JOIN users u ON u.id = p.added_by_user_id
    WHERE p.family_id = ? AND p.status = ? ORDER BY p.is_pinned DESC, p.level, p.date_added DESC`)
    .all(req.user.family_id, status);
  for (const p of rows) {
    p.carriers = db.prepare(`SELECT c.id,c.user_id,c.accepted,u.display_name FROM petition_carriers c JOIN users u ON u.id = c.user_id WHERE c.petition_id = ?`).all(p.id);
  }
  return res.json({ petitions: rows });
});

router.post('/petition', requireAuth, (req, res) => {
  const { person_name, relationship, petition, category, level } = req.body || {};
  if (!petition) return res.status(400).json({ error: 'petition required' });
  const isChild = req.user.role === 'child';
  let lvl = Number(level) || 3;
  if (lvl < 1) lvl = 1;
  if (lvl > 4) lvl = 4;
  // Children submitting level 1/2 require parent approval - we store the petition active but flag for approval.
  const requiresApproval = isChild && lvl <= 2 ? 1 : 0;
  const r = db.prepare('INSERT INTO prayer_petitions (family_id,added_by_user_id,person_name,relationship,petition,category,level,date_added) VALUES (?,?,?,?,?,?,?,?)')
    .run(req.user.family_id, req.user.id, person_name || null, relationship || null, petition, category || 'personal', lvl, today());
  const id = r.lastInsertRowid;
  db.prepare('INSERT INTO petition_events (petition_id,user_id,event_type,note) VALUES (?,?,?,?)')
    .run(id, req.user.id, 'created', requiresApproval ? 'pending tatay/nanay approval' : null);
  return res.json({ id, requires_approval: !!requiresApproval });
});

router.put('/petition/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM prayer_petitions WHERE id = ? AND family_id = ?').get(id, req.user.family_id);
  if (!existing) return res.status(404).json({ error: 'petition not found' });
  const isParent = req.user.role === 'tatay' || req.user.role === 'nanay';
  const owns = existing.added_by_user_id === req.user.id;
  if (!isParent && !owns) return res.status(403).json({ error: 'not allowed' });
  const allow = ['petition', 'category', 'level', 'is_pinned', 'person_name', 'relationship'];
  const parentOnly = ['level', 'is_pinned'];
  const updates = [];
  const values = [];
  for (const f of allow) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, f)) {
      if (parentOnly.includes(f) && !isParent) continue;
      updates.push(f + ' = ?');
      values.push(req.body[f]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'nothing to update' });
  values.push(id);
  db.prepare('UPDATE prayer_petitions SET ' + updates.join(', ') + ' WHERE id = ?').run(...values);
  db.prepare('INSERT INTO petition_events (petition_id,user_id,event_type,note) VALUES (?,?,?,?)').run(id, req.user.id, 'updated', null);
  return res.json({ ok: true });
});

router.post('/petition/:id/answer', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { how_god_answered } = req.body || {};
  const p = db.prepare('SELECT * FROM prayer_petitions WHERE id = ? AND family_id = ?').get(id, req.user.family_id);
  if (!p) return res.status(404).json({ error: 'petition not found' });
  const t = today();
  const tx = db.transaction(() => {
    db.prepare('UPDATE prayer_petitions SET status = ?, resolved_at = ?, resolution_note = ? WHERE id = ?')
      .run('answered', t, how_god_answered || null, id);
    db.prepare('INSERT INTO petition_events (petition_id,user_id,event_type,note) VALUES (?,?,?,?)').run(id, req.user.id, 'answered', how_god_answered || null);
    db.prepare('INSERT INTO prayer_inventory (family_id,source_type,source_id,person_name,original_intention,date_added,date_resolved,how_god_answered) VALUES (?,?,?,?,?,?,?,?)')
      .run(req.user.family_id, 'petition', id, p.person_name, p.petition, p.date_added, t, how_god_answered || null);
    if (how_god_answered) {
      db.prepare('INSERT INTO prayer_thanksgiving (family_id,added_by_user_id,person_name,thanksgiving_text,linked_petition_id,date_added) VALUES (?,?,?,?,?,?)')
        .run(req.user.family_id, req.user.id, p.person_name, how_god_answered, id, t);
    }
  });
  tx();
  return res.json({ ok: true });
});

router.post('/petition/:id/carrier', requireParent, (req, res) => {
  const id = Number(req.params.id);
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const p = db.prepare('SELECT id FROM prayer_petitions WHERE id = ? AND family_id = ?').get(id, req.user.family_id);
  if (!p) return res.status(404).json({ error: 'petition not found' });
  const exists = db.prepare('SELECT id FROM petition_carriers WHERE petition_id = ? AND user_id = ?').get(id, user_id);
  if (exists) return res.json({ ok: true, already: true });
  const r = db.prepare('INSERT INTO petition_carriers (petition_id,user_id,assigned_by_user_id) VALUES (?,?,?)').run(id, user_id, req.user.id);
  return res.json({ ok: true, id: r.lastInsertRowid });
});

// SICK
router.get('/sick', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT s.*, u.display_name AS added_by_name FROM prayer_sick s LEFT JOIN users u ON u.id = s.added_by_user_id WHERE s.family_id = ? AND s.status = ? ORDER BY s.date_added DESC`)
    .all(req.user.family_id, req.query.status || 'active');
  return res.json({ sick: rows });
});

router.post('/sick', requireAuth, (req, res) => {
  const { person_name, relationship, intention } = req.body || {};
  if (!person_name || !intention) return res.status(400).json({ error: 'person_name and intention required' });
  const r = db.prepare('INSERT INTO prayer_sick (family_id,added_by_user_id,person_name,relationship,intention,date_added) VALUES (?,?,?,?,?,?)')
    .run(req.user.family_id, req.user.id, person_name, relationship || null, intention, today());
  return res.json({ id: r.lastInsertRowid });
});

router.put('/sick/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const { status, deceased_dignity_text } = req.body || {};
  const s = db.prepare('SELECT * FROM prayer_sick WHERE id = ? AND family_id = ?').get(id, req.user.family_id);
  if (!s) return res.status(404).json({ error: 'sick entry not found' });
  if (!status) return res.status(400).json({ error: 'status required' });
  const t = today();
  const tx = db.transaction(() => {
    db.prepare('UPDATE prayer_sick SET status = ?, resolved_at = ? WHERE id = ?').run(status, t, id);
    if (status === 'recovered') {
      db.prepare('INSERT INTO prayer_thanksgiving (family_id,added_by_user_id,person_name,thanksgiving_text,date_added) VALUES (?,?,?,?,?)')
        .run(req.user.family_id, req.user.id, s.person_name, 'Recovered: ' + s.intention, t);
      db.prepare('INSERT INTO prayer_inventory (family_id,source_type,source_id,person_name,original_intention,date_added,date_resolved,how_god_answered) VALUES (?,?,?,?,?,?,?,?)')
        .run(req.user.family_id, 'sick', id, s.person_name, s.intention, s.date_added, t, 'recovery');
    } else if (status === 'deceased') {
      db.prepare('INSERT INTO repository_of_dead (family_id,added_by_user_id,full_name,relationship,brief_story,death_date) VALUES (?,?,?,?,?,?)')
        .run(req.user.family_id, req.user.id, s.person_name, s.relationship, deceased_dignity_text || s.intention, t);
    }
  });
  tx();
  return res.json({ ok: true });
});

// THANKSGIVING
router.get('/thanksgiving', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM prayer_thanksgiving WHERE family_id = ? ORDER BY date_added DESC LIMIT 100`).all(req.user.family_id);
  return res.json({ thanksgiving: rows });
});

router.post('/thanksgiving', requireAuth, (req, res) => {
  const { person_name, thanksgiving_text, linked_petition_id } = req.body || {};
  if (!thanksgiving_text) return res.status(400).json({ error: 'thanksgiving_text required' });
  const r = db.prepare('INSERT INTO prayer_thanksgiving (family_id,added_by_user_id,person_name,thanksgiving_text,linked_petition_id,date_added) VALUES (?,?,?,?,?,?)')
    .run(req.user.family_id, req.user.id, person_name || null, thanksgiving_text, linked_petition_id || null, today());
  return res.json({ id: r.lastInsertRowid });
});

// INVENTORY
router.get('/inventory', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let rows = db.prepare(`SELECT * FROM prayer_inventory WHERE family_id = ? ORDER BY date_resolved DESC LIMIT 500`).all(req.user.family_id);
  if (q) rows = rows.filter(r => ((r.person_name || '') + ' ' + (r.original_intention || '') + ' ' + (r.how_god_answered || '')).toLowerCase().includes(q));
  return res.json({ inventory: rows });
});

module.exports = router;
