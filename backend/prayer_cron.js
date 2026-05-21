// Prayer-time cron: every minute, find any family whose schedule lands in the
// last 1-minute window, push to all subscribed devices for that family, log
// idempotency so we never double-fire.
const webpush = require('web-push');
const db = require('./models/db');
const { phtToday, phtDate } = require('./lib/pht');

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const PRAYERS = [
  { key: 'morning_time',    label: 'Morning Offering',       url: '/?screen=morning' },
  { key: 'midmorning_time', label: 'Mid-Morning Prayer',     url: '/?screen=midmorning' },
  { key: 'angelus_time',    label: 'Angelus',                url: '/?screen=angelus' },
  { key: 'mercy_time',      label: 'Hour of Divine Mercy',   url: '/?screen=mercy' },
  { key: 'rosary_time',     label: 'Family Rosary',          url: '/?screen=walk-launch' },
  { key: 'night_time',      label: 'Night Prayer & Examen',  url: '/?screen=night' }
];

// Family schedules are wall-clock PHT (e.g. "05:30" = 5:30 AM Cebu time).
// Compare against PHT wall clock, not server local time.
function nowHHMM() {
  const d = phtDate();
  return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
}
function todayKey() {
  return phtToday();
}

async function pushToFamily(familyId, prayer, scheduledTime) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { skipped: 'no-vapid' };

  // Idempotency: never push the same prayer twice on the same day for the same family.
  const ins = db.prepare('INSERT OR IGNORE INTO push_fired_log (family_id, prayer_key, fired_date) VALUES (?, ?, ?)')
    .run(familyId, prayer.key, todayKey());
  if (ins.changes === 0) return { skipped: 'already-fired-today' };

  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE family_id = ?').all(familyId);
  if (!subs.length) return { sent: 0, subs: 0 };

  const payload = JSON.stringify({
    title: 'Heavenward - ' + prayer.label,
    body: 'It is ' + scheduledTime + '. Let us pray together. Pope Leo XIV.',
    url: prayer.url,
    tag: 'heavenward-' + prayer.key + '-' + todayKey()
  });

  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      db.prepare('UPDATE push_subscriptions SET last_pushed_at = CURRENT_TIMESTAMP WHERE id = ?').run(s.id);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id);
      } else {
        console.error('[push] family=' + familyId + ' sub=' + s.id + ' err=' + e.statusCode + ' ' + (e.body || ''));
      }
    }
  }
  return { sent, subs: subs.length };
}

async function tick() {
  try {
    const hhmm = nowHHMM();
    const rows = db.prepare('SELECT * FROM family_schedule WHERE active = 1').all();
    for (const s of rows) {
      for (const p of PRAYERS) {
        if (s[p.key] === hhmm) {
          const r = await pushToFamily(s.family_id, p, s[p.key]);
          console.log('[push-cron] ' + hhmm + ' family=' + s.family_id + ' ' + p.key + ' -> ' + JSON.stringify(r));
        }
      }
    }
  } catch (e) {
    console.error('[push-cron] tick error', e);
  }
}

function start() {
  // Align to the top of the next minute so checks happen at HH:MM:00-ish.
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  setTimeout(() => {
    tick();
    setInterval(tick, 60 * 1000);
  }, msToNextMinute);
  console.log('[push-cron] scheduled first tick in ' + msToNextMinute + 'ms');
}

module.exports = { start, tick, pushToFamily, PRAYERS };
