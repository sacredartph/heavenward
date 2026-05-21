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

// ============================================================
// Whisper Phase v17 - the interior life surfaces
// ============================================================
// 1) today's verse + diary prompt (Letter to God)
// 2) carried-for-me  (prayers offered FOR the current user)
// 3) a teaching to live  (one per day, rotating through Gifts, Fruits, Works, Beatitudes)
// 4) my moments today
// ============================================================

const TODAYS_VERSES = [
  { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
  { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are burdened, and I will give you rest.' },
  { ref: 'John 14:27', text: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give it to you.' },
  { ref: 'Philippians 4:6-7', text: 'Have no anxiety at all, but in everything, by prayer and petition, with thanksgiving, make your requests known to God.' },
  { ref: 'Isaiah 41:10', text: 'Do not fear: I am with you; do not be anxious: I am your God.' },
  { ref: 'Romans 8:28', text: 'We know that all things work for good for those who love God.' },
  { ref: 'Jeremiah 29:11', text: 'For I know well the plans I have in mind for you - plans for your welfare and not for woe.' },
  { ref: '2 Corinthians 12:9', text: 'My grace is sufficient for you, for power is made perfect in weakness.' },
  { ref: 'Luke 1:46-47', text: 'My soul proclaims the greatness of the Lord; my spirit rejoices in God my saviour.' },
  { ref: 'John 15:5', text: 'I am the vine, you are the branches. Whoever remains in me and I in him will bear much fruit.' },
  { ref: 'Matthew 6:33', text: 'Seek first the kingdom of God and his righteousness, and all these things will be given you besides.' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; there is nothing I lack.' },
  { ref: '1 John 4:19', text: 'We love because he first loved us.' },
  { ref: 'Matthew 5:8', text: 'Blessed are the clean of heart, for they will see God.' }
];

const DIARY_PROMPTS = [
  'Letter to God - what do you want to tell him today?',
  'Write to him as you would to your closest friend.',
  'What is on your heart that only he should hear?',
  'A confession, a thanksgiving, or a question - he is listening.',
  'What did this verse stir in you? Write to him about it.',
  'Speak to him plainly. He knows every word before you write it.',
  'What weight do you want to lay down here, with him?',
  'Begin: "Lord, today I..." and continue as long as you need.'
];

// 28 hand-curated teachings to live: 7 Gifts of the Holy Spirit, 9 Fruits,
// 7 Works of Mercy (corporal), 5 Beatitudes (the most quoted of the 8 + Sermon).
// Each: title, verse-or-source, one-sentence teaching, one practical move.
const TEACHINGS = [
  // Gifts of the Holy Spirit (Isaiah 11:2)
  { kind: 'gift', title: 'Wisdom', source: 'Gift of the Holy Spirit', teach: 'Wisdom is seeing your life from God\'s side of things.', move: 'Today, ask before you decide: "Lord, what would you do?"' },
  { kind: 'gift', title: 'Understanding', source: 'Gift of the Holy Spirit', teach: 'Understanding lets the truths of faith become alive in you, not just memorized.', move: 'Read one line of Scripture today and sit with it for a minute.' },
  { kind: 'gift', title: 'Counsel', source: 'Gift of the Holy Spirit', teach: 'Counsel is the quiet voice that helps you choose well in the moment.', move: 'When you hesitate today, pause and listen for one breath.' },
  { kind: 'gift', title: 'Fortitude', source: 'Gift of the Holy Spirit', teach: 'Fortitude is courage that does not depend on how you feel.', move: 'Do the one hard thing you have been avoiding.' },
  { kind: 'gift', title: 'Knowledge', source: 'Gift of the Holy Spirit', teach: 'Knowledge sees creation as a window onto the Creator.', move: 'Step outside today and thank God for one thing you see.' },
  { kind: 'gift', title: 'Piety', source: 'Gift of the Holy Spirit', teach: 'Piety is the warm reverence of a child for a Father.', move: 'Make the sign of the cross slowly, once, with attention.' },
  { kind: 'gift', title: 'Fear of the Lord', source: 'Gift of the Holy Spirit', teach: 'Holy fear is the love that does not want to grieve the one you love.', move: 'Avoid one thing today not because it is wrong but because he is good.' },

  // Fruits of the Holy Spirit (Galatians 5:22-23)
  { kind: 'fruit', title: 'Love', source: 'Galatians 5:22', teach: 'Love wills the good of the other - even when it costs.', move: 'Do one small thing for someone who cannot repay you.' },
  { kind: 'fruit', title: 'Joy', source: 'Galatians 5:22', teach: 'Christian joy is not a mood; it is the deep knowing that he is risen.', move: 'Smile at the next person you see, even before they smile.' },
  { kind: 'fruit', title: 'Peace', source: 'Galatians 5:22', teach: 'Peace is what remains when worry has been handed back to God.', move: 'When anxious today, breathe and say: "Jesus, I trust in you."' },
  { kind: 'fruit', title: 'Patience', source: 'Galatians 5:22', teach: 'Patience is love willing to wait without souring.', move: 'Let someone go ahead of you today. Anywhere. Anyone.' },
  { kind: 'fruit', title: 'Kindness', source: 'Galatians 5:22', teach: 'Kindness is the everyday face of holiness.', move: 'Say a sincere thank-you to someone who is usually overlooked.' },
  { kind: 'fruit', title: 'Goodness', source: 'Galatians 5:22', teach: 'Goodness is doing right when nobody is watching.', move: 'Tell the truth in a small thing today, even if the lie would be easier.' },
  { kind: 'fruit', title: 'Faithfulness', source: 'Galatians 5:22', teach: 'Faithfulness is showing up for God and for people, again and again.', move: 'Keep one promise today that you would rather skip.' },
  { kind: 'fruit', title: 'Gentleness', source: 'Galatians 5:23', teach: 'Gentleness is strength under perfect control.', move: 'Lower your voice once today when you are tempted to raise it.' },
  { kind: 'fruit', title: 'Self-control', source: 'Galatians 5:23', teach: 'Self-control sets you free; appetites set you in chains.', move: 'Skip one thing your appetite is reaching for. Offer it to Jesus.' },

  // Corporal Works of Mercy (Matthew 25:31-46)
  { kind: 'work', title: 'Feed the hungry', source: 'Corporal Work of Mercy', teach: 'When you feed the hungry, you feed Christ.', move: 'Give a real meal - not change - to one hungry person you pass.' },
  { kind: 'work', title: 'Give drink to the thirsty', source: 'Corporal Work of Mercy', teach: 'A cup of water is never a small thing in his eyes.', move: 'Bring a cold drink to someone working outside today.' },
  { kind: 'work', title: 'Clothe the naked', source: 'Corporal Work of Mercy', teach: 'Dignity often comes wrapped in a clean shirt.', move: 'Choose one good piece of clothing you do not need and give it away.' },
  { kind: 'work', title: 'Shelter the homeless', source: 'Corporal Work of Mercy', teach: 'Every home is a foretaste of the Father\'s house.', move: 'Pray today for one homeless person you see by name (ask their name).' },
  { kind: 'work', title: 'Visit the sick', source: 'Corporal Work of Mercy', teach: 'When you sit with the sick, Christ sits up.', move: 'Call or visit one sick person today. Stay longer than is comfortable.' },
  { kind: 'work', title: 'Visit the imprisoned', source: 'Corporal Work of Mercy', teach: 'People are imprisoned by more than walls; loneliness is a prison too.', move: 'Reach out to someone you know is isolated today.' },
  { kind: 'work', title: 'Bury the dead', source: 'Corporal Work of Mercy', teach: 'Caring for the body honors the temple of the Holy Spirit.', move: 'Pray for someone who died this week. Light a candle in your home.' },

  // Beatitudes (Matthew 5:3-12)
  { kind: 'beatitude', title: 'Blessed are the poor in spirit', source: 'Matthew 5:3', teach: 'To be poor in spirit is to know you have nothing he did not give you.', move: 'Thank God today for one thing you usually take for granted.' },
  { kind: 'beatitude', title: 'Blessed are the meek', source: 'Matthew 5:5', teach: 'Meekness is strength held in service of love.', move: 'Hold your tongue once today when you are right and could prove it.' },
  { kind: 'beatitude', title: 'Blessed are the merciful', source: 'Matthew 5:7', teach: 'Mercy is when love meets a wound.', move: 'Forgive someone today - even if only in your own heart.' },
  { kind: 'beatitude', title: 'Blessed are the pure of heart', source: 'Matthew 5:8', teach: 'Purity of heart is wanting one thing only - God.', move: 'Today, ask of every choice: "Does this draw me to him?"' },
  { kind: 'beatitude', title: 'Blessed are the peacemakers', source: 'Matthew 5:9', teach: 'Peacemakers carry the calm of Christ into a room.', move: 'Be the first to make peace in one tension you are part of.' }
];

function dayIndexOfYear() {
  const now = new Date();
  return Math.floor((Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

// Today's Word - daily Bible verse + diary prompt, deterministic per day.
router.get('/today-word', requireAuth, (req, res) => {
  const idx = dayIndexOfYear();
  const verse = TODAYS_VERSES[idx % TODAYS_VERSES.length];
  const prompt = DIARY_PROMPTS[idx % DIARY_PROMPTS.length];
  return res.json({ verse, prompt, date: new Date().toISOString().slice(0, 10) });
});

// A teaching to live - one per day, rotates Gifts -> Fruits -> Works -> Beatitudes.
router.get('/teaching', requireAuth, (req, res) => {
  const idx = dayIndexOfYear();
  const teaching = TEACHINGS[idx % TEACHINGS.length];
  return res.json({ teaching });
});

// Prayers offered FOR the current user. Built from hearth_posts where this
// user's first-name appears as the target, plus petition_carriers where another
// person is carrying a petition this user added.
router.get('/carried-for-me', requireAuth, (req, res) => {
  const me = req.user;
  const first = (me.display_name || '').split(' ')[0];
  if (!first) return res.json({ carried: [] });

  // Hearth posts that mention this user as the target ("... for Joaquin.")
  // We match the patterns we generate in hearth.js: "for <First>", "for <First>'s".
  const like1 = '%for ' + first + '.%';
  const like2 = '%for ' + first + '\'s%';
  const like3 = '%blessing to ' + first + '.%';
  const posts = db.prepare(`SELECT p.id, p.content, p.created_at, u.display_name AS from_name, u.patron_saint_slug AS from_slug
    FROM hearth_posts p JOIN users u ON u.id = p.user_id
    WHERE p.family_id = ? AND p.user_id <> ?
      AND (p.content LIKE ? OR p.content LIKE ? OR p.content LIKE ?)
    ORDER BY p.created_at DESC LIMIT 40`).all(me.family_id, me.id, like1, like2, like3);

  // Petitions the user added that someone else is now carrying.
  const carriers = db.prepare(`SELECT pc.petition_id, pc.assigned_at, u.display_name AS carrier_name, u.patron_saint_slug AS carrier_slug,
      pe.petition, pe.person_name
    FROM petition_carriers pc
    JOIN prayer_petitions pe ON pe.id = pc.petition_id
    JOIN users u ON u.id = pc.user_id
    WHERE pe.added_by_user_id = ? AND pc.user_id <> ?
    ORDER BY pc.assigned_at DESC LIMIT 20`).all(me.id, me.id);

  const carried = [];
  for (const p of posts) {
    carried.push({
      kind: 'gesture',
      from: p.from_name,
      from_slug: p.from_slug,
      text: p.content,
      at: p.created_at
    });
  }
  for (const c of carriers) {
    carried.push({
      kind: 'carry',
      from: c.carrier_name,
      from_slug: c.carrier_slug,
      text: c.carrier_name.split(' ')[0] + ' is carrying your intention: ' + c.petition,
      at: c.assigned_at
    });
  }
  carried.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  return res.json({ carried: carried.slice(0, 30) });
});

// My moments today - what I tapped in the stained-glass picker today.
router.get('/my-moments-today', requireAuth, (req, res) => {
  const rows = db.prepare(`SELECT moment_type, free_text, logged_at FROM moment_log
    WHERE user_id = ? AND date(logged_at,'+8 hours') = date('now','+8 hours') ORDER BY logged_at DESC`).all(req.user.id);
  return res.json({ moments: rows });
});

// ============================================================
// Diary - 99.9% private letters to God.
// Only the author can read or write their own rows. No family/parent visibility.
// ============================================================
router.get('/diary', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 200);
  const rows = db.prepare(`SELECT id, entry_date, verse_ref, verse_text, prompt, body, created_at
    FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(req.user.id, limit);
  return res.json({ entries: rows });
});

router.get('/diary/today', requireAuth, (req, res) => {
  const t = new Date().toISOString().slice(0, 10);
  const row = db.prepare(`SELECT id, entry_date, verse_ref, verse_text, prompt, body, created_at
    FROM diary_entries WHERE user_id = ? AND entry_date = ? ORDER BY created_at DESC LIMIT 1`).get(req.user.id, t);
  return res.json({ entry: row || null });
});

router.post('/diary', requireAuth, (req, res) => {
  const { body, verse_ref, verse_text, prompt } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'body required' });
  const t = new Date().toISOString().slice(0, 10);
  const r = db.prepare(`INSERT INTO diary_entries (user_id, entry_date, verse_ref, verse_text, prompt, body)
    VALUES (?,?,?,?,?,?)`).run(req.user.id, t, verse_ref || null, verse_text || null, prompt || null, String(body).trim());
  return res.json({ id: r.lastInsertRowid, entry_date: t });
});

router.put('/diary/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const entry = db.prepare('SELECT * FROM diary_entries WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'not found' });
  const body = (req.body && req.body.body) || '';
  if (!String(body).trim()) return res.status(400).json({ error: 'body required' });
  db.prepare('UPDATE diary_entries SET body = ? WHERE id = ?').run(String(body).trim(), id);
  return res.json({ ok: true });
});

router.delete('/diary/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare('DELETE FROM diary_entries WHERE id = ? AND user_id = ?').run(id, req.user.id);
  if (!r.changes) return res.status(404).json({ error: 'not found' });
  return res.json({ ok: true });
});

module.exports = router;
