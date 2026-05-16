// Saints library routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const mmdd = () => new Date().toISOString().slice(5, 10);

router.get('/', requireAuth, (req, res) => {
  const cat = req.query.category;
  const nat = req.query.nationality;
  const q = req.query.q;
  let rows = db.prepare(`SELECT slug,name,feast_day,category,nationality,patron_of,brief,key_quote FROM saints ORDER BY name`).all();
  if (cat) rows = rows.filter(r => r.category === cat);
  if (nat) rows = rows.filter(r => (r.nationality || '').toLowerCase() === nat.toLowerCase());
  if (q) {
    const s = q.toLowerCase();
    rows = rows.filter(r => (r.name + ' ' + (r.patron_of || '') + ' ' + (r.brief || '')).toLowerCase().includes(s));
  }
  return res.json({ saints: rows });
});

router.get('/today', requireAuth, (req, res) => {
  const cal = db.prepare('SELECT * FROM liturgical_calendar WHERE date = date(\'now\')').get();
  let saint = cal && cal.saint_slug ? db.prepare('SELECT * FROM saints WHERE slug = ?').get(cal.saint_slug) : null;
  if (!saint) saint = db.prepare('SELECT * FROM saints WHERE feast_day = ?').get(mmdd());
  if (!saint) saint = db.prepare('SELECT * FROM saints ORDER BY RANDOM() LIMIT 1').get();
  return res.json({ saint, liturgical: cal });
});

router.get('/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json({ saints: [] });
  const rows = db.prepare(`SELECT slug,name,feast_day,category,nationality,patron_of,brief,key_quote FROM saints`).all()
    .filter(r => (r.name + ' ' + (r.patron_of || '') + ' ' + (r.brief || '') + ' ' + (r.nationality || '')).toLowerCase().includes(q))
    .slice(0, 50);
  return res.json({ saints: rows });
});

router.get('/:slug', requireAuth, (req, res) => {
  const tier = req.user.age_tier || 'adult';
  const s = db.prepare('SELECT * FROM saints WHERE slug = ?').get(req.params.slug);
  if (!s) return res.status(404).json({ error: 'saint not found' });
  let story = s.full_story_adult;
  if (tier === 'child' && s.full_story_child) story = s.full_story_child;
  else if (tier === 'preteen' && s.full_story_child) story = s.full_story_child;
  else if (tier === 'teen' && s.full_story_teen) story = s.full_story_teen;
  return res.json({ saint: Object.assign({}, s, { story_for_user: story }) });
});

module.exports = router;
