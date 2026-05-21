// Hours / Morning / Night / Saint-of-the-day routes.
// All "today" lookups are in Philippine Standard Time (UTC+8). The server's
// own timezone is irrelevant - liturgy and tallies always follow the user's
// calendar day in Cebu.
const express = require('express');
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');
const { phtToday, phtTodayMMDD, phtYearDay, PHT_OFFSET_MS } = require('../lib/pht');

const router = express.Router();
const today = () => phtToday();
const mmdd = () => phtTodayMMDD();

// Common-of-saints fallback: when the calendar has no Gospel ref, pick one keyed to
// the saint's category so EVERY day has a Gospel + a family question (the design contract).
const COMMON_BY_CATEGORY = {
  martyr:     { ref: 'Matthew 10:28-33', question: 'What is something I will never give up, no matter what?' },
  apostle:    { ref: 'Mark 16:15-20',    question: 'Jesus sent the apostles to all the world. Where am I sent today?' },
  doctor:     { ref: 'Matthew 13:51-52', question: 'What did I learn about God this week that I want to remember?' },
  religious:  { ref: 'Matthew 19:27-29', question: 'What is one little thing I can give up today for love of Jesus?' },
  marian:     { ref: 'Luke 1:46-55',     question: 'Mary sang of God\'s greatness. What in my life will I praise him for today?' },
  married:    { ref: 'Matthew 19:3-6',   question: 'What can our family do today to love each other better?' },
  pope:       { ref: 'John 21:15-17',    question: 'Feed my lambs - Jesus said to Peter. Whom can I feed today?' },
  patriarch:  { ref: 'Matthew 1:18-24',  question: 'Like Joseph, where am I asked to listen quietly and obey?' },
  evangelist: { ref: 'Mark 16:15-20',    question: 'What good news about Jesus can I share with my family today?' },
  angel:      { ref: 'Matthew 18:10',    question: 'My guardian angel walks with me. Will I say hello today?' },
  bishop:     { ref: 'John 10:11-16',    question: 'A good shepherd lays down his life. Whom am I shepherding?' },
  lay_youth:  { ref: 'Matthew 19:13-15', question: 'Jesus called the children to him. What does he want to tell me today?' },
  devotion:   { ref: 'John 15:9-12',     question: 'Remain in my love - Jesus said. Where am I letting his love in?' },
  feast:      { ref: 'John 15:9-12',     question: 'Where am I being asked to love today, like Jesus loves me?' }
};
const SEASON_FALLBACK = {
  advent:    { ref: 'Luke 21:34-36', question: 'Stay awake! What in my heart needs to wake up for Christmas?' },
  christmas: { ref: 'John 1:14',     question: 'The Word became flesh. Where will I welcome him in this home today?' },
  lent:      { ref: 'Matthew 6:1-6', question: 'Lent is for cleaning my heart. What needs cleaning today?' },
  easter:    { ref: 'John 20:19-23', question: 'He is risen! What in me can rise again today?' },
  ordinary:  { ref: 'Matthew 5:1-12', question: 'Which Beatitude feels most like me today?' }
};

router.get('/today', requireAuth, (req, res) => {
  const cal = db.prepare('SELECT * FROM liturgical_calendar WHERE date = ?').get(today());
  let saint = cal && cal.saint_slug ? db.prepare('SELECT * FROM saints WHERE slug = ?').get(cal.saint_slug) : null;
  if (!saint) saint = db.prepare('SELECT * FROM saints WHERE feast_day = ?').get(mmdd());
  if (!saint) {
    const all = db.prepare('SELECT * FROM saints ORDER BY name').all();
    if (all.length) {
      saint = all[phtYearDay() % all.length];
    }
  }
  let headline = null, kind = 'ordinary';
  if (cal && cal.feast_name && (cal.feast_rank === 'solemnity' || cal.feast_rank === 'feast')) {
    headline = cal.feast_name;
    kind = cal.feast_rank;
  } else if (saint) {
    headline = 'Memorial of ' + saint.name;
    kind = 'memorial';
  } else if (cal) {
    headline = (cal.season ? cal.season.charAt(0).toUpperCase() + cal.season.slice(1) : 'Ordinary') + ' Time';
    kind = 'season';
  }
  // Gospel fallback: lectionary -> common of saints by category -> seasonal beatitude.
  let gospel_ref = cal && cal.gospel_ref;
  let gospel_question = cal && cal.gospel_question;
  let gospel_source = (cal && cal.gospel_ref) ? 'lectionary' : null;
  if (!gospel_ref && saint && COMMON_BY_CATEGORY[saint.category]) {
    const c = COMMON_BY_CATEGORY[saint.category];
    gospel_ref = c.ref; gospel_question = c.question; gospel_source = 'common-of-saints';
  }
  if (!gospel_ref) {
    const seasonKey = (cal && cal.season) || 'ordinary';
    const s = SEASON_FALLBACK[seasonKey] || SEASON_FALLBACK.ordinary;
    gospel_ref = s.ref; gospel_question = s.question; gospel_source = 'season';
  }
  const liturgical = Object.assign({}, cal || { season: 'ordinary' }, { gospel_ref, gospel_question, gospel_source });

  const hours = db.prepare("SELECT hour_type, COUNT(*) c, MAX(logged_at) last FROM hours_log WHERE user_id = ? AND date(logged_at,'+8 hours') = date('now','+8 hours') GROUP BY hour_type").all(req.user.id);
  const done = {};
  for (const h of hours) done[h.hour_type] = { count: h.c, last: h.last };

  // Today's contribution at the family level (the candles lit, names carried, etc.)
  const candlesToday = db.prepare("SELECT COUNT(*) c FROM hearth_candles WHERE family_id = ? AND date(lit_at,'+8 hours') = date('now','+8 hours')").get(req.user.family_id).c;
  const rosariesToday = db.prepare("SELECT COUNT(*) c, COALESCE(SUM(steps),0) steps FROM rosary_walks WHERE family_id = ? AND date(started_at,'+8 hours') = date('now','+8 hours') AND ended_at IS NOT NULL").get(req.user.family_id);
  const contribution = {
    candles_lit_today: candlesToday,
    rosaries_today: rosariesToday.c,
    steps_today: rosariesToday.steps
  };

  return res.json({ liturgical, saint, done, headline, kind, contribution });
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
    const yesterday = phtToday(Date.now() - 86400000);
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
