// Liturgical calendar generator.
// Generates day-by-day liturgical entries for the year using a fixed-feast table
// plus computed movable feasts (Easter and friends) using the Meeus/Gregorian algorithm.
//
// Lectionary cycle: ABC rotates yearly. 2025=C, 2026=A, 2027=B, 2028=C, ...

function lectionaryYear(year) {
  // Liturgical Year A begins on the First Sunday of Advent of the previous calendar year.
  // For Heavenward 0.9 we use a simplified mapping by calendar year.
  const r = year % 3;
  if (r === 0) return 'C';
  if (r === 1) return 'A';
  return 'B';
}

// Meeus / Butcher Gregorian algorithm for Easter.
function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date, days) {
  const r = new Date(date.getTime());
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function mmdd(date) {
  return iso(date).slice(5);
}

// First Sunday of Advent = Sunday on or after Nov 27 and before Dec 4.
function firstSundayOfAdvent(year) {
  let d = new Date(Date.UTC(year, 10, 27));
  while (d.getUTCDay() !== 0) d = addDays(d, 1);
  return d;
}

// Fixed-date feasts (MM-DD), each with rank and (optional) saint_slug, gospel_ref, gospel_question.
const fixedFeasts = {
  '01-01': { name: 'Solemnity of Mary, Mother of God', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 2:16-21', gq: 'Mary kept all these things in her heart. What will our family keep from this day?' },
  '01-06': { name: 'Epiphany of the Lord', rank: 'solemnity', gospel_ref: 'Matthew 2:1-12', gq: 'The wise men brought gifts. What gift can I give Jesus today?' },
  '01-24': { name: 'St. Francis de Sales', rank: 'memorial', saint_slug: 'francis-de-sales', gospel_ref: 'John 15:9-17', gq: 'Whom in our family can I be gentler with today?' },
  '01-28': { name: 'St. Thomas Aquinas', rank: 'memorial', saint_slug: 'thomas-aquinas', gospel_ref: 'Matthew 23:8-12', gq: 'What is one question about Jesus I have never asked out loud?' },
  '01-31': { name: 'St. John Bosco', rank: 'memorial', saint_slug: 'john-bosco', gospel_ref: 'Matthew 18:1-5', gq: 'Who is a young person in my life I can be kinder to?' },
  '02-02': { name: 'Presentation of the Lord', rank: 'feast', gospel_ref: 'Luke 2:22-40', gq: 'Mary and Joseph presented Jesus. What part of me will I present to God today?' },
  '02-14': { name: 'Sts. Cyril and Methodius', rank: 'memorial', saint_slug: 'cyril-methodius', gospel_ref: 'Luke 10:1-9', gq: 'Who is one person who has never heard about Jesus that I could tell?' },
  '03-12': { name: 'St. Maximilian of Tebessa', rank: 'optional', saint_slug: 'maximilian-of-tebessa', gospel_ref: 'Matthew 5:1-12', gq: 'What is something I will not do, no matter what, because I am Catholic?' },
  '03-17': { name: 'St. Patrick', rank: 'memorial', saint_slug: 'patrick', gospel_ref: 'Luke 5:1-11', gq: 'Whom is God sending me to this week - even just to listen?' },
  '03-19': { name: 'Solemnity of St. Joseph', rank: 'solemnity', saint_slug: 'joseph', gospel_ref: 'Matthew 1:16-24', gq: 'St. Joseph never said a word in the Bible. Where can I obey God in silence today?' },
  '03-25': { name: 'Annunciation of the Lord', rank: 'solemnity', gospel_ref: 'Luke 1:26-38', gq: 'Mary said yes. What yes is God asking me for today?' },
  '04-02': { name: 'Blessed Pedro Calungsod', rank: 'memorial', saint_slug: 'pedro-calungsod', gospel_ref: 'John 12:24-26', gq: 'Pedro was a Filipino teenager who did not run. Where would I be brave today?' },
  '04-23': { name: 'St. George', rank: 'memorial', saint_slug: 'george', gospel_ref: 'John 15:18-21', gq: 'What dragon is God asking me to face this week?' },
  '04-25': { name: 'St. Mark the Evangelist', rank: 'feast', saint_slug: 'mark', gospel_ref: 'Mark 16:15-20', gq: 'What good news about Jesus can I bring home today?' },
  '04-28': { name: 'St. Gianna Beretta Molla', rank: 'memorial', saint_slug: 'gianna-molla', gospel_ref: 'John 15:13', gq: 'For whom in my family would I give everything?' },
  '04-29': { name: 'St. Catherine of Siena', rank: 'memorial', saint_slug: 'catherine-of-siena', gospel_ref: 'Matthew 11:25-30', gq: 'Where is God asking me to speak the truth, even when it is hard?' },
  '05-10': { name: 'St. Damien of Molokai', rank: 'memorial', saint_slug: 'damien-of-molokai', gospel_ref: 'Matthew 25:31-40', gq: 'Whom in our city is hard to love that we could pray for tonight?' },
  '05-22': { name: 'St. Rita of Cascia', rank: 'memorial', saint_slug: 'rita', gospel_ref: 'Matthew 17:20', gq: 'What impossible prayer can I bring to God tonight?' },
  '05-30': { name: 'St. Joan of Arc', rank: 'memorial', saint_slug: 'joan-of-arc', gospel_ref: 'Mark 8:34-38', gq: 'What does God want me to do that I am a little afraid of?' },
  '06-13': { name: 'St. Anthony of Padua', rank: 'memorial', saint_slug: 'anthony-of-padua', gospel_ref: 'Luke 10:1-9', gq: 'What in my life feels lost? Ask St. Anthony to help me find it.' },
  '06-22': { name: 'St. Thomas More', rank: 'memorial', saint_slug: 'thomas-more', gospel_ref: 'Matthew 10:28', gq: 'God\'s good servant first - whose servant am I first today?' },
  '06-29': { name: 'Sts. Peter and Paul', rank: 'solemnity', saint_slug: 'peter', gospel_ref: 'Matthew 16:13-19', gq: 'Who do I say that Jesus is - in my own words?' },
  '07-04': { name: 'Blessed Pier Giorgio Frassati', rank: 'memorial', saint_slug: 'pier-giorgio-frassati', gospel_ref: 'Matthew 5:3-12', gq: 'Verso l\'alto - to the heights. What mountain is God asking me to climb?' },
  '07-11': { name: 'St. Benedict of Nursia', rank: 'memorial', saint_slug: 'benedict-of-nursia', gospel_ref: 'Luke 22:24-27', gq: 'Pray and work. Which one do I need more of today?' },
  '07-14': { name: 'St. Kateri Tekakwitha', rank: 'memorial', saint_slug: 'kateri', gospel_ref: 'Matthew 11:25-30', gq: 'Where can I love Jesus quietly today, when no one sees?' },
  '07-22': { name: 'St. Mary Magdalene', rank: 'feast', saint_slug: 'mary-magdalene', gospel_ref: 'John 20:1-18', gq: 'Mary Magdalene ran to tell that he is risen. Whom will I tell today?' },
  '07-25': { name: 'St. James the Greater', rank: 'feast', saint_slug: 'james-the-greater', gospel_ref: 'Matthew 20:20-28', gq: 'Can you drink the cup? - Jesus asked. What cup is in my life right now?' },
  '07-26': { name: 'Sts. Joachim and Anne', rank: 'memorial', saint_slug: 'cecilia-day-prayer', gospel_ref: 'Matthew 13:16-17', gq: 'Today is for grandparents. Whom can I thank or pray for?' },
  '07-31': { name: 'St. Ignatius of Loyola', rank: 'memorial', saint_slug: 'ignatius-of-loyola', gospel_ref: 'Luke 14:25-33', gq: 'Go forth and set the world on fire. Where will I start - in my own home?' },
  '08-08': { name: 'St. Dominic', rank: 'memorial', saint_slug: 'dominic', gospel_ref: 'Matthew 16:13-19', gq: 'What truth about God do I need to share this week?' },
  '08-09': { name: 'St. Teresa Benedicta of the Cross', rank: 'memorial', saint_slug: 'teresa-benedicta', gospel_ref: 'Matthew 16:24-26', gq: 'She walked toward the cross for her people. For whom would I do the same?' },
  '08-11': { name: 'St. Philomena', rank: 'optional', saint_slug: 'philomena', gospel_ref: 'Matthew 5:8', gq: 'Blessed are the pure of heart. What is making my heart cloudy?' },
  '08-14': { name: 'St. Maximilian Kolbe', rank: 'memorial', saint_slug: 'maximilian-kolbe', gospel_ref: 'John 15:13', gq: 'Kolbe stepped forward to die in place of a stranger. In whose place could I step today?' },
  '08-15': { name: 'Assumption of the Blessed Virgin Mary', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 1:39-56', gq: 'Mary is in heaven body and soul. Where is she leading our family today?' },
  '08-23': { name: 'St. Rose of Lima', rank: 'memorial', saint_slug: 'rose-of-lima', gospel_ref: 'Matthew 13:44-46', gq: 'What treasure would I give everything to keep?' },
  '08-27': { name: 'St. Monica', rank: 'memorial', saint_slug: 'monica', gospel_ref: 'Luke 7:11-17', gq: 'Monica prayed 17 years for Augustine. Who needs my patient prayer?' },
  '08-28': { name: 'St. Augustine of Hippo', rank: 'memorial', saint_slug: 'augustine', gospel_ref: 'Matthew 23:8-12', gq: 'Where is my heart still restless? Bring it to Jesus tonight.' },
  '08-30': { name: 'St. Jeanne Jugan', rank: 'optional', saint_slug: 'jeanne-jugan', gospel_ref: 'Matthew 25:31-40', gq: 'How can our family make a place for the elderly we know?' },
  '09-05': { name: 'St. Teresa of Calcutta', rank: 'memorial', saint_slug: 'mother-teresa', gospel_ref: 'Matthew 25:31-40', gq: 'Whose face is Jesus wearing in my life today?' },
  '09-08': { name: 'Nativity of the Blessed Virgin Mary', rank: 'feast', saint_slug: 'mary', gospel_ref: 'Matthew 1:1-16', gq: 'Mama Mary\'s birthday. What can I give her today?' },
  '09-14': { name: 'Exaltation of the Holy Cross', rank: 'feast', gospel_ref: 'John 3:13-17', gq: 'Where is the cross becoming a doorway in my life?' },
  '09-15': { name: 'Our Lady of Sorrows', rank: 'memorial', saint_slug: 'mary', gospel_ref: 'John 19:25-27', gq: 'Mary stood at the cross. Whose sorrow can I stand beside today?' },
  '09-21': { name: 'St. Matthew the Apostle', rank: 'feast', saint_slug: 'matthew', gospel_ref: 'Matthew 9:9-13', gq: 'From what table is Jesus asking me to stand up and follow?' },
  '09-23': { name: 'St. Pio of Pietrelcina', rank: 'memorial', saint_slug: 'padre-pio', gospel_ref: 'Matthew 16:24-28', gq: 'Pray, hope, and do not worry. What can I hand to him tonight?' },
  '09-28': { name: 'St. Lorenzo Ruiz and Companions', rank: 'memorial', saint_slug: 'lorenzo-ruiz', gospel_ref: 'Luke 9:23-26', gq: 'San Lorenzo gave a thousand lives to Christ. What would I give today?' },
  '09-29': { name: 'Sts. Michael, Gabriel, and Raphael, Archangels', rank: 'feast', saint_slug: 'michael-archangel', gospel_ref: 'John 1:47-51', gq: 'Which angel does my family need to call on this week?' },
  '09-30': { name: 'St. Jerome', rank: 'memorial', saint_slug: 'jerome', gospel_ref: 'Matthew 13:47-52', gq: 'Ignorance of Scripture is ignorance of Christ. Will I read one verse tonight?' },
  '10-01': { name: 'St. Therese of the Child Jesus', rank: 'memorial', saint_slug: 'therese-of-lisieux', gospel_ref: 'Matthew 18:1-4', gq: 'What small thing can I do today with great love?' },
  '10-04': { name: 'St. Francis of Assisi', rank: 'memorial', saint_slug: 'francis-of-assisi', gospel_ref: 'Matthew 11:25-30', gq: 'Francis let go of everything. What can I let go of, even just for today?' },
  '10-05': { name: 'St. Faustina Kowalska', rank: 'memorial', saint_slug: 'faustina', gospel_ref: 'John 20:19-23', gq: 'Jesus, I trust in you. Where do I most need to say it?' },
  '10-15': { name: 'St. Teresa of Avila', rank: 'memorial', saint_slug: 'teresa-of-avila', gospel_ref: 'John 15:1-8', gq: 'God alone suffices. What else am I trying to be filled with?' },
  '10-18': { name: 'St. Luke the Evangelist', rank: 'feast', saint_slug: 'luke', gospel_ref: 'Luke 10:1-9', gq: 'Luke was a healer. Whom can I bring healing words to today?' },
  '10-22': { name: 'St. John Paul II', rank: 'memorial', saint_slug: 'john-paul-ii', gospel_ref: 'John 21:15-17', gq: 'Be not afraid! What is JP2 saying to me right now?' },
  '11-01': { name: 'All Saints', rank: 'solemnity', gospel_ref: 'Matthew 5:1-12', gq: 'Which saint feels closest to me today? Will I ask their help?' },
  '11-02': { name: 'All Souls', rank: 'solemnity', gospel_ref: 'John 6:37-40', gq: 'Whom of our beloved dead will I remember by name at Mass today?' },
  '11-03': { name: 'St. Martin de Porres', rank: 'memorial', saint_slug: 'martin-de-porres', gospel_ref: 'Matthew 25:31-46', gq: 'What humble task in our home can become my prayer today?' },
  '11-17': { name: 'St. Elizabeth of Hungary', rank: 'memorial', saint_slug: 'elizabeth-of-hungary', gospel_ref: 'Luke 6:27-38', gq: 'Where could our family be more generous to the poor this week?' },
  '11-22': { name: 'St. Cecilia', rank: 'memorial', saint_slug: 'cecilia', gospel_ref: 'Matthew 25:1-13', gq: 'What song is my heart singing to God right now?' },
  '11-30': { name: 'St. Andrew the Apostle', rank: 'feast', saint_slug: 'andrew', gospel_ref: 'Matthew 4:18-22', gq: 'Andrew brought his brother to Jesus. Whom can I bring?' },
  '12-06': { name: 'St. Nicholas of Myra', rank: 'memorial', saint_slug: 'nicholas', gospel_ref: 'Luke 10:1-9', gq: 'What secret gift can I give today, like St. Nicholas?' },
  '12-08': { name: 'Immaculate Conception', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 1:26-38', gq: 'Mary was sinless from the start. What grace do I most need from her today?' },
  '12-12': { name: 'Our Lady of Guadalupe', rank: 'feast', saint_slug: 'mary', gospel_ref: 'Luke 1:39-47', gq: 'Our Lady speaks every language. What does she say to my heart today?' },
  '12-14': { name: 'St. John of the Cross', rank: 'memorial', saint_slug: 'john-of-the-cross', gospel_ref: 'Matthew 11:25-30', gq: 'Where in the dark is God still loving me?' },
  '12-25': { name: 'Nativity of the Lord', rank: 'solemnity', gospel_ref: 'Luke 2:1-14', gq: 'God became a baby for me. What part of me will I let him hold?' },
  '12-26': { name: 'St. Stephen, Protomartyr', rank: 'feast', saint_slug: 'stephen', gospel_ref: 'Matthew 10:17-22', gq: 'Stephen forgave his killers. Whom must I forgive this Christmas?' },
  '12-27': { name: 'St. John the Apostle', rank: 'feast', saint_slug: 'john-the-apostle', gospel_ref: 'John 20:2-8', gq: 'God is love. Where is that love breaking into my Christmas this year?' }
};

// Determine current liturgical season for a given date.
function seasonFor(date, easter, advent1) {
  const t = date.getTime();
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const christmasEve = new Date(Date.UTC(date.getUTCFullYear(), 11, 24));
  const epiphany = new Date(Date.UTC(date.getUTCFullYear(), 0, 6));
  const baptismOfLord = addDays(epiphany, 7);
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if ((month === 11 && day >= 25) || (month === 0 && day <= 5)) return 'christmas';
  if (t >= advent1.getTime() && t < christmasEve.getTime()) return 'advent';
  if (t > epiphany.getTime() && t <= baptismOfLord.getTime()) return 'christmas';
  if (t >= ashWednesday.getTime() && t < easter.getTime()) return 'lent';
  if (t >= easter.getTime() && t <= pentecost.getTime()) return 'easter';
  return 'ordinary';
}

// Sunday gospel rotation (fallback when the lectionary lookup misses).
const sundayDefaultGospel = {
  ordinary: { ref: 'Matthew 5:1-12', q: 'Where do the Beatitudes meet me this week?' },
  advent: { ref: 'Matthew 24:37-44', q: 'Am I awake for the coming of Christ?' },
  christmas: { ref: 'John 1:1-14', q: 'How has the Word become flesh in my home?' },
  lent: { ref: 'Mark 1:12-15', q: 'What is the Spirit driving me into?' },
  easter: { ref: 'John 20:1-9', q: 'Where am I running to find him risen?' }
};

const { generateMovableFeasts } = require('./movable_feasts');
const LECTIONARY = require('./sunday_lectionary');

// Determine the liturgical "slug" for a Sunday (e.g. "ordinary-12", "lent-3", "easter-5").
// Returns null when the date is not a Sunday or the slug cannot be determined.
function sundaySlug(date, easter, advent1) {
  if (date.getUTCDay() !== 0) return null;
  const t = date.getTime();

  // Advent Sundays
  const advYear = date.getUTCFullYear();
  const advThisYear = firstSundayOfAdvent(advYear);
  const advPrevYear = firstSundayOfAdvent(advYear - 1);
  const advRef = (t >= advThisYear.getTime()) ? advThisYear : advPrevYear;
  // If we are in Advent (between advRef and the following Dec 24)
  const dec24 = new Date(Date.UTC(advRef.getUTCFullYear(), 11, 24));
  if (t >= advRef.getTime() && t <= dec24.getTime()) {
    const wk = Math.round((t - advRef.getTime()) / (7 * 86400000)) + 1;
    if (wk >= 1 && wk <= 4) return 'advent-' + wk;
  }

  // Christmas Octave / Holy Family / Mary Mother of God / Epiphany / Baptism
  const m = date.getUTCMonth(), d = date.getUTCDate();
  if (m === 11 && d >= 25) return 'holy-family';
  if (m === 0 && d <= 7)   return 'mary-mother-of-god';
  // Epiphany observed on Sunday after Jan 1
  if (m === 0 && d >= 2 && d <= 8) return 'epiphany';
  // Baptism = Sunday after Epiphany
  if (m === 0 && d >= 9 && d <= 13) return 'baptism-of-lord';

  // Lent (Ash Wednesday to Holy Saturday)
  const ash = addDays(easter, -46);
  if (t >= ash.getTime() && t < easter.getTime()) {
    // Sundays of Lent: 1st = Sunday after Ash Wed; 5th = the one two Sundays before Easter; Palm = the Sunday before Easter
    const palmSunday = addDays(easter, -7);
    if (t === palmSunday.getTime()) return 'palm-sunday';
    // Count Sundays from Ash Wed
    let s = new Date(ash.getTime());
    while (s.getUTCDay() !== 0) s = addDays(s, 1);
    const wk = Math.round((t - s.getTime()) / (7 * 86400000)) + 1;
    if (wk >= 1 && wk <= 5) return 'lent-' + wk;
  }

  // Easter Season
  if (t === easter.getTime()) return 'easter';
  const pentecost = addDays(easter, 49);
  if (t > easter.getTime() && t <= pentecost.getTime()) {
    if (t === pentecost.getTime()) return 'pentecost';
    const wk = Math.round((t - easter.getTime()) / (7 * 86400000)) + 1;
    // The "Ascension Sunday" (7th Sunday of Easter, transferred in many places)
    if (wk === 7 && t === addDays(easter, 42).getTime()) return 'ascension';
    if (wk >= 2 && wk <= 7) return 'easter-' + wk;
  }

  // Trinity Sunday and Corpus Christi (Sunday observance)
  const trinity = addDays(easter, 56);
  const corpus = addDays(easter, 63);
  const christKing = addDays(advent1, -7);
  if (t === trinity.getTime()) return 'trinity';
  if (t === corpus.getTime())  return 'corpus-christi';
  if (t === christKing.getTime()) return 'christ-the-king';

  // Ordinary Time. Two blocks: post-Baptism through Tuesday before Ash Wed; then Monday after Pentecost through Sat before Advent.
  // Counting: Christ the King is week 34. Count Sundays backwards from there for the post-Pentecost block.
  // Pre-Lent block: start counting from Sunday-after-Baptism = week 2.
  const baptism = (() => {
    // Sunday on or after Jan 7 in the same calendar year as `date` OR previous year if `date` is before Baptism
    let candidate = new Date(Date.UTC(date.getUTCFullYear(), 0, 7));
    while (candidate.getUTCDay() !== 0) candidate = addDays(candidate, 1);
    return candidate;
  })();
  // Pre-Lent ordinary
  const sundayAfterBaptism = (() => { let s = addDays(baptism, 7); return s; })();
  if (t >= sundayAfterBaptism.getTime() && t < ash.getTime()) {
    const wk = Math.round((t - sundayAfterBaptism.getTime()) / (7 * 86400000)) + 2;
    if (wk >= 2 && wk <= 34) return 'ordinary-' + wk;
  }
  // Post-Pentecost ordinary (counting backwards from Christ the King = week 34)
  if (t > pentecost.getTime() && t < christKing.getTime()) {
    const weeksToCK = Math.round((christKing.getTime() - t) / (7 * 86400000));
    const wk = 34 - weeksToCK;
    if (wk >= 2 && wk <= 34) return 'ordinary-' + wk;
  }
  return null;
}

function applyLectionary(entry, date, easter, advent1, cycleYear) {
  if (date.getUTCDay() !== 0) return;
  if (entry.gospel_ref) return; // already set by fixed-feasts or movable
  const slug = sundaySlug(date, easter, advent1);
  if (!slug) return;
  const cycle = LECTIONARY[cycleYear] || LECTIONARY.A;
  const reading = cycle[slug];
  if (!reading) return;
  entry.gospel_ref = reading.ref;
  entry.gospel_question = reading.question;
  if (!entry.feast_name) {
    // Pretty label from slug
    const pretty = slug.replace(/^([a-z])/, (c) => c.toUpperCase()).replace(/-/g, ' ').replace(/(\d+)/, (n) => ordinalLabel(Number(n)));
    entry.feast_name = pretty;
  }
}
function ordinalLabel(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return n + 'th';
}

function generateYear(year) {
  const out = [];
  const easter = easterDate(year);
  const advent1 = firstSundayOfAdvent(year);
  const lectYear = lectionaryYear(year);

  // Build a lookup of movable feasts by ISO date for fast injection.
  const movable = generateMovableFeasts(year, easter);
  const movableByDate = {};
  for (const f of movable) {
    // Last one wins if collisions (e.g. transferred Ascension lands on Sunday already named)
    movableByDate[f.iso_date] = f;
  }

  let d = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  while (d.getTime() <= end.getTime()) {
    const key = mmdd(d);
    const season = seasonFor(d, easter, advent1);
    const isSunday = d.getUTCDay() === 0;

    let entry = {
      date: iso(d),
      season,
      feast_name: null,
      feast_rank: isSunday ? 'sunday' : null,
      saint_slug: null,
      lectionary_year: lectYear,
      gospel_ref: null,
      gospel_question: null
    };

    // Layer 1: fixed feasts (Mar 19 Joseph, Aug 15 Assumption, etc.)
    if (fixedFeasts[key]) {
      const f = fixedFeasts[key];
      entry.feast_name = f.name;
      entry.feast_rank = f.rank;
      entry.saint_slug = f.saint_slug || null;
      entry.gospel_ref = f.gospel_ref || null;
      entry.gospel_question = f.gq || null;
    }

    // Layer 2: movable feasts (Easter, Palm Sunday, Ascension, Pentecost, Trinity, Christ the King, ...)
    if (movableByDate[entry.date]) {
      const m = movableByDate[entry.date];
      entry.feast_name = m.name;
      entry.feast_rank = m.rank;
      if (m.saint_slug) entry.saint_slug = m.saint_slug;
      entry.gospel_ref = m.gospel_ref;
      entry.gospel_question = m.gospel_question;
    }

    // Layer 3: Sunday lectionary lookup (only when no feast already set the gospel)
    if (isSunday) {
      applyLectionary(entry, d, easter, advent1, lectYear);
    }

    // Layer 4: graceful fallback so every Sunday has SOMETHING
    if (isSunday && !entry.gospel_ref) {
      const g = sundayDefaultGospel[season] || sundayDefaultGospel.ordinary;
      entry.gospel_ref = g.ref;
      entry.gospel_question = g.q;
      if (!entry.feast_name) {
        entry.feast_name = 'Sunday in ' + season.charAt(0).toUpperCase() + season.slice(1) + ' Time';
      }
    }

    // Always-correct overrides
    if (iso(d) === iso(easter)) {
      entry.feast_name = 'Easter Sunday of the Resurrection of the Lord';
      entry.feast_rank = 'solemnity';
      entry.gospel_ref = 'John 20:1-9';
      entry.gospel_question = 'He is risen. What in my life can rise again with him?';
    }
    if (iso(d) === iso(addDays(easter, -46))) {
      entry.feast_name = 'Ash Wednesday';
      entry.feast_rank = 'solemnity';
      entry.gospel_ref = 'Matthew 6:1-6,16-18';
      entry.gospel_question = 'What am I giving up so I can be more given over?';
    }

    out.push(entry);
    d = addDays(d, 1);
  }
  return out;
}

module.exports = { generateYear, easterDate, lectionaryYear, fixedFeasts };
