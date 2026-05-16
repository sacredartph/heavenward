// Hours / Morning / Night / Saint-of-the-day routes.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const today = () => new Date().toISOString().slice(0, 10);
const mmdd = () => today().slice(5);

router.get('/today', requireAuth, (req, res) => {
  const cal = db.prepare('SELECT * FROM liturgical_calendar WHERE date = ?').get(today());
  let saint = cal && cal.saint_slug ? db.prepare('SELECT * FROM saints WHERE slug = ?').get(cal.saint_slug) : null;
  if (!saint) saint = db.prepare('SELECT * FROM saints WHERE feast_day = ?').get(mmdd());
  if (!saint) {
    // Stable fallback for the day: choose by day-of-year so it does not jump every reload.
    const all = db.prepare('SELECT * FROM saints ORDER BY name').all();
    if (all.length) {
      const dayNum = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      saint = all[dayNum % all.length];
    }
  }
  const hours = db.prepare('SELECT hour_type, COUNT(*) c FROM hours_log WHERE user_id = ? AND date(logged_at) = date(\'now\') GROUP BY hour_type').all(req.user.id);
  const done = {};
  for (const h of hours) done[h.hour_type] = h.c;
  return res.json({ liturgical: cal, saint, done });
});

router.post('/log', requireAuth, (req, res) => {
  const { hour_type, duration_seconds } = req.body || {};
  const allowed = ['morning_offering', 'lauds', 'compline', 'examen', 'rosary', 'angelus', 'reading'];
  if (!hour_type || !allowed.includes(hour_type)) return res.status(400).json({ error: 'hour_type invalid' });
  db.prepare('INSERT INTO hours_log (user_id,hour_type,duration_seconds) VALUES (?,?,?)').run(req.user.id, hour_type, duration_seconds || null);
  // streak management
  const t = today();
  const u = db.prepare('SELECT streak_days,last_activity_date FROM users WHERE id = ?').get(req.user.id);
  let streak = (u && u.streak_days) || 0;
  if (u && u.last_activity_date === t) {
    // no change
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = u && u.last_activity_date === yesterday ? streak + 1 : 1;
    db.prepare('UPDATE users SET streak_days = ?, last_activity_date = ? WHERE id = ?').run(streak, t, req.user.id);
  }
  return res.json({ ok: true, streak_days: streak });
});

router.get('/saint', requireAuth, (req, res) => {
  const cal = db.prepare('SELECT * FROM liturgical_calendar WHERE date = ?').get(today());
  let saint = null;
  if (cal && cal.saint_slug) saint = db.prepare('SELECT * FROM saints WHERE slug = ?').get(cal.saint_slug);
  if (!saint) {
    saint = db.prepare('SELECT * FROM saints WHERE feast_day = ?').get(mmdd());
  }
  if (!saint) saint = db.prepare('SELECT * FROM saints ORDER BY RANDOM() LIMIT 1').get();
  return res.json({ saint, liturgical: cal });
});

router.get('/morning', requireAuth, (req, res) => {
  // Morning prayer payload: greeting, saint, morning offering, lauds, gospel of day, intentions to carry.
  const cal = db.prepare('SELECT * FROM liturgical_calendar WHERE date = ?').get(today());
  const saint = cal && cal.saint_slug ? db.prepare('SELECT slug,name,key_quote,brief FROM saints WHERE slug = ?').get(cal.saint_slug) : db.prepare('SELECT slug,name,key_quote,brief FROM saints WHERE feast_day = ? LIMIT 1').get(mmdd());
  // emergency or urgent petitions to carry
  const carry = db.prepare(`SELECT id,petition,person_name,level FROM prayer_petitions WHERE family_id = ? AND status = ? AND level <= 2 ORDER BY level, date_added DESC LIMIT 10`).all(req.user.family_id, 'active');
  return res.json({
    liturgical: cal,
    saint,
    offering: {
      title: 'Morning Offering',
      text: 'O Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys and sufferings of this day for all the intentions of your Sacred Heart, in union with the holy sacrifice of the Mass throughout the world, for the salvation of souls, the reparation for sins, the reunion of all Christians, and in particular for the intentions of our Holy Father Pope Leo XIV this month. Amen.'
    },
    lauds: {
      psalm_verse: 'O Lord, open my lips; and my mouth shall declare your praise. (Psalm 51:15)',
      benedictus_intro: 'Blessed be the Lord, the God of Israel, for he has visited and redeemed his people. (Luke 1:68)',
      collect: 'Almighty God, you have given us this day; let nothing draw us from you, nor anyone be cast aside by us. Through Christ our Lord. Amen.'
    },
    gospel: cal && cal.gospel_ref ? { ref: cal.gospel_ref, question: cal.gospel_question } : null,
    carry
  });
});

router.get('/night', requireAuth, (req, res) => {
  const tier = req.user.age_tier || 'adult';
  const examens = {
    child: [
      'Did you say thank you to God today?',
      'Did you love Tatay and Nanay today?',
      'What was the best moment with Jesus today?'
    ],
    preteen: [
      'When did I feel God close today?',
      'When did I push him away?',
      'Was I kind to my family?',
      'What can I do better tomorrow?',
      'What am I thankful for tonight?'
    ],
    teen: [
      'Place yourself in God’s presence — slowly.',
      'Review the day with gratitude — name three gifts.',
      'Ask the Holy Spirit to show you the truth of the day.',
      'Review the day — where did you grow, where did you fall?',
      'Look forward to tomorrow with hope and resolve.'
    ],
    adult: [
      'Place yourself in God’s presence.',
      'Give thanks for the graces of this day.',
      'Ask the Holy Spirit to show you the day as it truly was.',
      'Review the day in detail — moments of light and shadow.',
      'Sorrow for what was sin; resolve for tomorrow.',
      'Look at tomorrow and entrust it to him.'
    ],
    elderly: [
      'Sit with God in the quiet of the evening.',
      'Give thanks for the long mercy of this day and of your life.',
      'Look back. Where did love appear?',
      'What still needs forgiveness — given or received?',
      'Hand tomorrow into his hands.'
    ]
  };
  return res.json({
    psalm: { ref: 'Psalm 91', verse: 'He that dwelleth in the aid of the most High, shall abide under the protection of the God of Heaven. (Psalm 91:1, Douay-Rheims)' },
    nunc_dimittis: 'Lord, now lettest thou thy servant depart in peace, according to thy word: because my eyes have seen thy salvation, which thou hast prepared before the face of all peoples. (Luke 2:29-31, Douay-Rheims)',
    salve_regina: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious Advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus.',
    examen: examens[tier] || examens.adult,
    age_tier: tier
  });
});

module.exports = router;
