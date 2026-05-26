// Saints library routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const { phtTodayMMDD } = require('../lib/pht');

const router = express.Router();
const mmdd = () => phtTodayMMDD();

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
  const cal = db.prepare("SELECT * FROM liturgical_calendar WHERE date = date('now','+8 hours')").get();
  let saint = cal && cal.saint_slug ? db.prepare('SELECT * FROM saints WHERE slug = ?').get(cal.saint_slug) : null;
  if (!saint) saint = db.prepare('SELECT * FROM saints WHERE feast_day = ?').get(mmdd());
  if (!saint) saint = db.prepare('SELECT * FROM saints ORDER BY RANDOM() LIMIT 1').get();
  return res.json({ saint, liturgical: cal });
});

// A different saint every time the user opens "Walk with a Saint."
// - If today carries a real liturgical memorial (calendar saint_slug is set),
//   we keep that saint about 30% of the time so the day's saint still shows up
//   often without monopolising every walk.
// - Otherwise we draw a uniformly random saint from the library, optionally
//   excluding the one the user just walked with (?notSlug=) so consecutive
//   walks don't repeat.
// - Only saints with a usable text body (key_quote or full_story_adult) are
//   eligible - walking with a saint who has no words to say is empty.
router.get('/random', requireAuth, (req, res) => {
  const notSlug = (req.query.notSlug || '').trim() || null;
  const cal = db.prepare("SELECT * FROM liturgical_calendar WHERE date = date('now','+8 hours')").get();
  const todaySlug = cal && cal.saint_slug ? cal.saint_slug : null;

  // 30% chance to honor today's saint when there is a real memorial.
  if (todaySlug && todaySlug !== notSlug && Math.random() < 0.30) {
    const s = db.prepare('SELECT * FROM saints WHERE slug = ?').get(todaySlug);
    if (s) return res.json({ saint: s, source: 'today', liturgical: cal });
  }

  // Otherwise: random eligible saint, excluding the one passed in notSlug.
  const params = [];
  let where = "(key_quote IS NOT NULL AND length(key_quote) > 4) OR (full_story_adult IS NOT NULL AND length(full_story_adult) > 80)";
  if (notSlug) { where = '(' + where + ') AND slug != ?'; params.push(notSlug); }
  const saint = db.prepare(`SELECT * FROM saints WHERE ${where} ORDER BY RANDOM() LIMIT 1`).get(...params);
  if (!saint) {
    // Last resort: any saint at all.
    const fallback = db.prepare('SELECT * FROM saints ORDER BY RANDOM() LIMIT 1').get();
    return res.json({ saint: fallback, source: 'fallback', liturgical: cal });
  }
  return res.json({ saint, source: 'random', liturgical: cal });
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
