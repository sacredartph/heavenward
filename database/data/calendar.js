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
  '01-01': { name: 'Solemnity of Mary, Mother of God', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 2:16-21', gq: 'How does Mary hold this day in her heart?' },
  '01-06': { name: 'Epiphany of the Lord', rank: 'solemnity', gospel_ref: 'Matthew 2:1-12', gq: 'What gift am I bringing to Christ this season?' },
  '01-24': { name: 'St. Francis de Sales', rank: 'memorial', saint_slug: 'francis-de-sales', gospel_ref: 'John 15:9-17', gq: 'Where is God asking me to be gentle today?' },
  '01-28': { name: 'St. Thomas Aquinas', rank: 'memorial', saint_slug: 'thomas-aquinas', gospel_ref: 'Matthew 23:8-12', gq: 'What is one truth I have not yet sought?' },
  '01-31': { name: 'St. John Bosco', rank: 'memorial', saint_slug: 'john-bosco', gospel_ref: 'Matthew 18:1-5', gq: 'How am I caring for the young people God has put in my life?' },
  '02-02': { name: 'Presentation of the Lord', rank: 'feast', gospel_ref: 'Luke 2:22-40', gq: 'What am I being asked to present to God today?' },
  '02-14': { name: 'Sts. Cyril and Methodius', rank: 'memorial', gospel_ref: 'Luke 10:1-9', gq: 'How is God sending me out?' },
  '03-12': { name: 'St. Maximilian of Tebessa', rank: 'optional', saint_slug: 'maximilian-of-tebessa', gospel_ref: 'Matthew 5:1-12', gq: 'What is my conscience refusing to compromise on?' },
  '03-17': { name: 'St. Patrick', rank: 'memorial', saint_slug: 'patrick', gospel_ref: 'Luke 5:1-11', gq: 'Whom am I being sent to?' },
  '03-19': { name: 'Solemnity of St. Joseph', rank: 'solemnity', saint_slug: 'joseph', gospel_ref: 'Matthew 1:16-24', gq: 'What is the Father quietly asking me to do?' },
  '03-25': { name: 'Annunciation of the Lord', rank: 'solemnity', gospel_ref: 'Luke 1:26-38', gq: 'What is my fiat today?' },
  '04-02': { name: 'Blessed Pedro Calungsod', rank: 'memorial', saint_slug: 'pedro-calungsod', gospel_ref: 'John 12:24-26', gq: 'Where am I being asked to stand my ground?' },
  '04-23': { name: 'St. George', rank: 'memorial', saint_slug: 'george', gospel_ref: 'John 15:18-21', gq: 'What dragon is God asking me to face?' },
  '04-25': { name: 'St. Mark the Evangelist', rank: 'feast', saint_slug: 'mark', gospel_ref: 'Mark 16:15-20', gq: 'What is the good news I am called to bring?' },
  '04-28': { name: 'St. Gianna Beretta Molla', rank: 'memorial', saint_slug: 'gianna-molla', gospel_ref: 'John 15:13', gq: 'For whom am I being asked to lay down my life today?' },
  '04-29': { name: 'St. Catherine of Siena', rank: 'memorial', saint_slug: 'catherine-of-siena', gospel_ref: 'Matthew 11:25-30', gq: 'Where is the Spirit asking me to speak truth to power?' },
  '05-10': { name: 'St. Damien of Molokai', rank: 'memorial', saint_slug: 'damien-of-molokai', gospel_ref: 'Matthew 25:31-40', gq: 'Whom am I avoiding because they are hard to love?' },
  '05-22': { name: 'St. Rita of Cascia', rank: 'memorial', saint_slug: 'rita', gospel_ref: 'Matthew 17:20', gq: 'What impossible thing am I being asked to bring to God?' },
  '05-30': { name: 'St. Joan of Arc', rank: 'memorial', saint_slug: 'joan-of-arc', gospel_ref: 'Mark 8:34-38', gq: 'What is God asking that scares me?' },
  '06-13': { name: 'St. Anthony of Padua', rank: 'memorial', saint_slug: 'anthony-of-padua', gospel_ref: 'Luke 10:1-9', gq: 'What in my life is lost and needs to be found?' },
  '06-22': { name: 'St. Thomas More', rank: 'memorial', saint_slug: 'thomas-more', gospel_ref: 'Matthew 10:28', gq: 'Whose servant am I, first?' },
  '06-29': { name: 'Sts. Peter and Paul', rank: 'solemnity', saint_slug: 'peter', gospel_ref: 'Matthew 16:13-19', gq: 'Who do I say that Jesus is?' },
  '07-04': { name: 'Blessed Pier Giorgio Frassati', rank: 'memorial', saint_slug: 'pier-giorgio-frassati', gospel_ref: 'Matthew 5:3-12', gq: 'Verso l’alto. Where is the next height?' },
  '07-11': { name: 'St. Benedict of Nursia', rank: 'memorial', saint_slug: 'benedict-of-nursia', gospel_ref: 'Luke 22:24-27', gq: 'Where do I need more stability, more prayer, more work?' },
  '07-14': { name: 'St. Kateri Tekakwitha', rank: 'memorial', saint_slug: 'kateri', gospel_ref: 'Matthew 11:25-30', gq: 'How am I keeping a hidden faithfulness?' },
  '07-22': { name: 'St. Mary Magdalene', rank: 'feast', saint_slug: 'mary-magdalene', gospel_ref: 'John 20:1-18', gq: 'To whom am I called to proclaim that he is risen?' },
  '07-25': { name: 'St. James the Greater', rank: 'feast', saint_slug: 'james-the-greater', gospel_ref: 'Matthew 20:20-28', gq: 'What cup is Christ asking me to drink?' },
  '07-26': { name: 'Sts. Joachim and Anne', rank: 'memorial', saint_slug: 'cecilia-day-prayer', gospel_ref: 'Matthew 13:16-17', gq: 'For whose grandchild am I praying?' },
  '07-31': { name: 'St. Ignatius of Loyola', rank: 'memorial', saint_slug: 'ignatius-of-loyola', gospel_ref: 'Luke 14:25-33', gq: 'What am I being asked to set on fire?' },
  '08-08': { name: 'St. Dominic', rank: 'memorial', saint_slug: 'dominic', gospel_ref: 'Matthew 16:13-19', gq: 'What truth am I being asked to preach?' },
  '08-09': { name: 'St. Teresa Benedicta of the Cross', rank: 'memorial', saint_slug: 'teresa-benedicta', gospel_ref: 'Matthew 16:24-26', gq: 'For whom must I go?' },
  '08-11': { name: 'St. Philomena', rank: 'optional', saint_slug: 'philomena', gospel_ref: 'Matthew 5:8', gq: 'What does pure of heart look like for me today?' },
  '08-14': { name: 'St. Maximilian Kolbe', rank: 'memorial', saint_slug: 'maximilian-kolbe', gospel_ref: 'John 15:13', gq: 'In whose place am I being asked to step?' },
  '08-15': { name: 'Assumption of the Blessed Virgin Mary', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 1:39-56', gq: 'Where is Mary leading my family today?' },
  '08-23': { name: 'St. Rose of Lima', rank: 'memorial', saint_slug: 'rose-of-lima', gospel_ref: 'Matthew 13:44-46', gq: 'What treasure am I willing to give everything for?' },
  '08-27': { name: 'St. Monica', rank: 'memorial', saint_slug: 'monica', gospel_ref: 'Luke 7:11-17', gq: 'For whose conversion am I praying with persistence?' },
  '08-28': { name: 'St. Augustine of Hippo', rank: 'memorial', saint_slug: 'augustine', gospel_ref: 'Matthew 23:8-12', gq: 'Where is my heart still restless?' },
  '08-30': { name: 'St. Jeanne Jugan', rank: 'optional', saint_slug: 'jeanne-jugan', gospel_ref: 'Matthew 25:31-40', gq: 'Where am I being asked to make a place for the elderly?' },
  '09-05': { name: 'St. Teresa of Calcutta', rank: 'memorial', saint_slug: 'mother-teresa', gospel_ref: 'Matthew 25:31-40', gq: 'In whose distressing disguise am I called to find Christ today?' },
  '09-08': { name: 'Nativity of the Blessed Virgin Mary', rank: 'feast', saint_slug: 'mary', gospel_ref: 'Matthew 1:1-16', gq: 'Where am I rejoicing in the birth of Our Lady?' },
  '09-14': { name: 'Exaltation of the Holy Cross', rank: 'feast', gospel_ref: 'John 3:13-17', gq: 'How is the cross becoming victory in my life?' },
  '09-15': { name: 'Our Lady of Sorrows', rank: 'memorial', saint_slug: 'mary', gospel_ref: 'John 19:25-27', gq: 'Where in my family is Mary standing with her Son?' },
  '09-21': { name: 'St. Matthew the Apostle', rank: 'feast', saint_slug: 'matthew', gospel_ref: 'Matthew 9:9-13', gq: 'From which table is Christ calling me to rise?' },
  '09-23': { name: 'St. Pio of Pietrelcina', rank: 'memorial', saint_slug: 'padre-pio', gospel_ref: 'Matthew 16:24-28', gq: 'Where can I pray more and worry less?' },
  '09-28': { name: 'St. Lorenzo Ruiz and Companions', rank: 'memorial', saint_slug: 'lorenzo-ruiz', gospel_ref: 'Luke 9:23-26', gq: 'How many lives would I give to follow Christ?' },
  '09-29': { name: 'Sts. Michael, Gabriel, and Raphael, Archangels', rank: 'feast', saint_slug: 'michael-archangel', gospel_ref: 'John 1:47-51', gq: 'Which angel is God asking me to invoke today?' },
  '09-30': { name: 'St. Jerome', rank: 'memorial', saint_slug: 'jerome', gospel_ref: 'Matthew 13:47-52', gq: 'Have I let the Scriptures speak to me this week?' },
  '10-01': { name: 'St. Therese of the Child Jesus', rank: 'memorial', saint_slug: 'therese-of-lisieux', gospel_ref: 'Matthew 18:1-4', gq: 'What small thing can I do today with great love?' },
  '10-04': { name: 'St. Francis of Assisi', rank: 'memorial', saint_slug: 'francis-of-assisi', gospel_ref: 'Matthew 11:25-30', gq: 'Where can I let go of one more thing for Christ?' },
  '10-05': { name: 'St. Faustina Kowalska', rank: 'memorial', saint_slug: 'faustina', gospel_ref: 'John 20:19-23', gq: 'Where do I need to trust in his mercy?' },
  '10-15': { name: 'St. Teresa of Avila', rank: 'memorial', saint_slug: 'teresa-of-avila', gospel_ref: 'John 15:1-8', gq: 'Where is God alone enough for me?' },
  '10-18': { name: 'St. Luke the Evangelist', rank: 'feast', saint_slug: 'luke', gospel_ref: 'Luke 10:1-9', gq: 'How is Christ asking me to be a healer today?' },
  '10-22': { name: 'St. John Paul II', rank: 'memorial', saint_slug: 'john-paul-ii', gospel_ref: 'John 21:15-17', gq: 'Where am I being told: be not afraid?' },
  '11-01': { name: 'All Saints', rank: 'solemnity', gospel_ref: 'Matthew 5:1-12', gq: 'Which saint feels closest to me today?' },
  '11-02': { name: 'All Souls', rank: 'solemnity', gospel_ref: 'John 6:37-40', gq: 'Whom am I remembering at the altar today?' },
  '11-03': { name: 'St. Martin de Porres', rank: 'memorial', saint_slug: 'martin-de-porres', gospel_ref: 'Matthew 25:31-46', gq: 'What humble task can become my prayer today?' },
  '11-17': { name: 'St. Elizabeth of Hungary', rank: 'memorial', saint_slug: 'elizabeth-of-hungary', gospel_ref: 'Luke 6:27-38', gq: 'Where can I be more generous to the poor at my gate?' },
  '11-22': { name: 'St. Cecilia', rank: 'memorial', saint_slug: 'cecilia', gospel_ref: 'Matthew 25:1-13', gq: 'What song is my heart singing to God?' },
  '11-30': { name: 'St. Andrew the Apostle', rank: 'feast', saint_slug: 'andrew', gospel_ref: 'Matthew 4:18-22', gq: 'Whom am I bringing to meet Jesus?' },
  '12-06': { name: 'St. Nicholas of Myra', rank: 'memorial', saint_slug: 'nicholas', gospel_ref: 'Luke 10:1-9', gq: 'What secret gift can I give today?' },
  '12-08': { name: 'Immaculate Conception', rank: 'solemnity', saint_slug: 'mary', gospel_ref: 'Luke 1:26-38', gq: 'How is Mary going before me in grace?' },
  '12-12': { name: 'Our Lady of Guadalupe', rank: 'feast', saint_slug: 'mary', gospel_ref: 'Luke 1:39-47', gq: 'Where is Mary leading the Americas, and where is she leading me?' },
  '12-14': { name: 'St. John of the Cross', rank: 'memorial', saint_slug: 'john-of-the-cross', gospel_ref: 'Matthew 11:25-30', gq: 'Where in the dark is God still loving me?' },
  '12-25': { name: 'Nativity of the Lord', rank: 'solemnity', gospel_ref: 'Luke 2:1-14', gq: 'Where is Christ asking to be born in me?' },
  '12-26': { name: 'St. Stephen, Protomartyr', rank: 'feast', saint_slug: 'stephen', gospel_ref: 'Matthew 10:17-22', gq: 'Whom must I forgive today?' },
  '12-27': { name: 'St. John the Apostle', rank: 'feast', saint_slug: 'john-the-apostle', gospel_ref: 'John 20:2-8', gq: 'Where is the love of God breaking into my life?' }
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

// Sunday gospel rotation (very simplified — one verse per Sunday by month).
const sundayDefaultGospel = {
  ordinary: { ref: 'Matthew 5:1-12', q: 'Where do the Beatitudes meet me this week?' },
  advent: { ref: 'Matthew 24:37-44', q: 'Am I awake for the coming of Christ?' },
  christmas: { ref: 'John 1:1-14', q: 'How has the Word become flesh in my home?' },
  lent: { ref: 'Mark 1:12-15', q: 'What is the Spirit driving me into?' },
  easter: { ref: 'John 20:1-9', q: 'Where am I running to find him risen?' }
};

function generateYear(year) {
  const out = [];
  const easter = easterDate(year);
  const advent1 = firstSundayOfAdvent(year);
  const lectYear = lectionaryYear(year);

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

    if (fixedFeasts[key]) {
      const f = fixedFeasts[key];
      entry.feast_name = f.name;
      entry.feast_rank = f.rank;
      entry.saint_slug = f.saint_slug || null;
      entry.gospel_ref = f.gospel_ref || null;
      entry.gospel_question = f.gq || null;
    }

    if (isSunday && !entry.gospel_ref) {
      const g = sundayDefaultGospel[season] || sundayDefaultGospel.ordinary;
      entry.gospel_ref = g.ref;
      entry.gospel_question = g.q;
      if (!entry.feast_name) {
        entry.feast_name = 'Sunday in ' + season.charAt(0).toUpperCase() + season.slice(1) + ' Time';
      }
    }

    // Easter Sunday override
    if (iso(d) === iso(easter)) {
      entry.feast_name = 'Easter Sunday of the Resurrection of the Lord';
      entry.feast_rank = 'solemnity';
      entry.gospel_ref = 'John 20:1-9';
      entry.gospel_question = 'He is risen. Where is my running, my searching, my joy today?';
    }
    // Ash Wednesday
    if (iso(d) === iso(addDays(easter, -46))) {
      entry.feast_name = 'Ash Wednesday';
      entry.feast_rank = 'solemnity';
      entry.gospel_ref = 'Matthew 6:1-6,16-18';
      entry.gospel_question = 'What am I giving up that I might be more given over?';
    }
    // Pentecost
    if (iso(d) === iso(addDays(easter, 49))) {
      entry.feast_name = 'Pentecost Sunday';
      entry.feast_rank = 'solemnity';
      entry.gospel_ref = 'John 20:19-23';
      entry.gospel_question = 'What is the Holy Spirit asking of me right now?';
    }

    out.push(entry);
    d = addDays(d, 1);
  }
  return out;
}

module.exports = { generateYear, easterDate, lectionaryYear, fixedFeasts };
