// Movable feasts of the Roman calendar - all computed from Easter.
// Returns an array of { iso_date, name, rank, saint_slug, gospel_ref, gospel_question } for one year.

function addDays(date, days) {
  const r = new Date(date.getTime());
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}
function iso(date) { return date.toISOString().slice(0, 10); }

// First Sunday of Advent: Sunday on or after Nov 27 and before Dec 4.
function firstSundayOfAdvent(year) {
  let d = new Date(Date.UTC(year, 10, 27));
  while (d.getUTCDay() !== 0) d = addDays(d, 1);
  return d;
}

function generateMovableFeasts(year, easter) {
  const advent1 = firstSundayOfAdvent(year);
  const palmSunday    = addDays(easter, -7);
  const holyMonday    = addDays(easter, -6);
  const holyTuesday   = addDays(easter, -5);
  const holyWednesday = addDays(easter, -4);
  const holyThursday  = addDays(easter, -3);
  const goodFriday    = addDays(easter, -2);
  const holySaturday  = addDays(easter, -1);
  const divineMercy   = addDays(easter, 7);
  const ascension     = addDays(easter, 42); // 7th Sunday of Easter - transferred ascension (Philippine practice)
  const ascensionThu  = addDays(easter, 39); // Traditional Thursday observance
  const pentecost     = addDays(easter, 49);
  const motherChurch  = addDays(easter, 50);
  const trinity       = addDays(easter, 56);
  const corpusChristi = addDays(easter, 63);
  const sacredHeart   = addDays(easter, 68);
  const immaculateHeart = addDays(easter, 69);
  const christKing    = addDays(advent1, -7);

  return [
    { iso_date: iso(palmSunday),    name: 'Palm Sunday of the Passion of the Lord', rank: 'solemnity',
      gospel_ref: 'Matthew 21:1-11', gospel_question: 'When Jesus rides into your week, will you welcome him or hide?' },
    { iso_date: iso(holyMonday),    name: 'Monday of Holy Week', rank: 'feria',
      gospel_ref: 'John 12:1-11', gospel_question: 'Whose feet would you anoint with everything you have?' },
    { iso_date: iso(holyTuesday),   name: 'Tuesday of Holy Week', rank: 'feria',
      gospel_ref: 'John 13:21-33,36-38', gospel_question: 'Where in my heart am I tempted to deny him this week?' },
    { iso_date: iso(holyWednesday), name: 'Wednesday of Holy Week', rank: 'feria',
      gospel_ref: 'Matthew 26:14-25', gospel_question: 'Lord, is it I? - the apostles all asked. Will I ask too?' },
    { iso_date: iso(holyThursday),  name: 'Holy Thursday - Evening Mass of the Lord\'s Supper', rank: 'solemnity',
      gospel_ref: 'John 13:1-15', gospel_question: 'Whose feet is Jesus asking me to wash this Holy Week?' },
    { iso_date: iso(goodFriday),    name: 'Good Friday of the Lord\'s Passion', rank: 'solemnity',
      gospel_ref: 'John 18:1-19:42', gospel_question: 'Stand at the foot of the Cross today. What do you see?' },
    { iso_date: iso(holySaturday),  name: 'Holy Saturday', rank: 'solemnity',
      gospel_ref: 'silence - the Lord is in the tomb', gospel_question: 'Can you wait quietly today? He is in the tomb.' },
    // Easter Sunday already in the base generator
    { iso_date: iso(divineMercy),   name: 'Second Sunday of Easter (Sunday of Divine Mercy)', rank: 'solemnity', saint_slug: 'faustina',
      gospel_ref: 'John 20:19-31', gospel_question: 'Where is Jesus asking, "Do you trust me?"' },
    { iso_date: iso(ascensionThu),  name: 'Ascension of the Lord (Thursday)', rank: 'solemnity',
      gospel_ref: 'Matthew 28:16-20', gospel_question: 'He went up - and he sent us. Where am I being sent?' },
    { iso_date: iso(ascension),     name: 'Ascension of the Lord (Sunday transferred)', rank: 'solemnity',
      gospel_ref: 'Matthew 28:16-20', gospel_question: 'He went up - and he sent us. Where am I being sent?' },
    { iso_date: iso(pentecost),     name: 'Pentecost Sunday', rank: 'solemnity',
      gospel_ref: 'John 20:19-23', gospel_question: 'Come, Holy Spirit! What do I most need from you today?' },
    { iso_date: iso(motherChurch),  name: 'Mary, Mother of the Church', rank: 'memorial', saint_slug: 'pentecost-mary',
      gospel_ref: 'John 19:25-34', gospel_question: 'Mary is the Mother of the Church. How does she mother me?' },
    { iso_date: iso(trinity),       name: 'Most Holy Trinity', rank: 'solemnity',
      gospel_ref: 'John 16:12-15', gospel_question: 'Father, Son, Holy Spirit - which one feels closest to me right now?' },
    { iso_date: iso(corpusChristi), name: 'Most Holy Body and Blood of Christ (Corpus Christi)', rank: 'solemnity',
      gospel_ref: 'Luke 9:11b-17', gospel_question: 'When I receive him at Mass - do I really believe it is Him?' },
    { iso_date: iso(sacredHeart),   name: 'Most Sacred Heart of Jesus', rank: 'solemnity', saint_slug: 'sacred-heart',
      gospel_ref: 'Luke 15:3-7', gospel_question: 'Jesus carries his lost sheep home on his shoulders. Am I letting him carry me?' },
    { iso_date: iso(immaculateHeart), name: 'Immaculate Heart of the Blessed Virgin Mary', rank: 'memorial', saint_slug: 'mary',
      gospel_ref: 'Luke 2:41-51', gospel_question: 'Mary pondered all these things in her heart. What am I pondering today?' },
    { iso_date: iso(christKing),    name: 'Our Lord Jesus Christ, King of the Universe', rank: 'solemnity',
      gospel_ref: 'Luke 23:35-43', gospel_question: 'Jesus, remember me. Where do I most need him to remember me today?' }
  ];
}

module.exports = { generateMovableFeasts, firstSundayOfAdvent };
