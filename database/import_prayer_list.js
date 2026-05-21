// One-shot import of Bryan's Prayer.xlsx into Heavenward.
// Reads C:\Users\PC\Documents\Prayer.xlsx, splits the three sections
// (Eternal Repose / Health / General Intercession), and inserts rows into
// repository_of_dead, prayer_sick, and prayer_people respectively.
// Idempotent: skips a row if a same-named entry already exists in the same family.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const xlsx = require('xlsx');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH.replace(/^\.\//, ''))
  : path.join(__dirname, 'heavenward.db');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const OWNER_EMAIL = process.env.IMPORT_OWNER_EMAIL || 'tatay@manubag.ph';
const SRC = process.argv[2] || 'C:/Users/PC/Documents/Prayer.xlsx';

const owner = db.prepare('SELECT id, family_id, display_name FROM users WHERE email = ?').get(OWNER_EMAIL);
if (!owner) {
  console.error('Owner user not found:', OWNER_EMAIL);
  process.exit(1);
}
console.log('Owner:', owner.display_name, '(user_id=' + owner.id + ', family_id=' + owner.family_id + ')');

const wb = xlsx.readFile(SRC);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Walk the sheet and bucket rows by the most recent header we saw.
const SECTION_HEADERS = new Set(['eternal repose', 'health', 'general intercession']);
const buckets = { 'eternal repose': [], 'health': [], 'general intercession': [] };
let current = null;
for (const r of rows) {
  const a = String(r[0] || '').trim();
  const b = String(r[1] || '').trim();
  if (!a && !b) continue;
  const key = a.toLowerCase();
  if (SECTION_HEADERS.has(key) && !b) { current = key; continue; }
  if (!current) continue;
  buckets[current].push({ name: a, rel: b });
}
console.log('Eternal Repose:', buckets['eternal repose'].length,
            ' Health:', buckets['health'].length,
            ' General Intercession:', buckets['general intercession'].length);

// Some name quirks to clean up before insert.
function cleanName(s) {
  return s.replace(/\s+/g, ' ').trim();
}

// Map relationship -> category for prayer_people.
function categoryFor(rel) {
  const r = (rel || '').toLowerCase();
  if (!r) return 'other';
  if (/personnel/.test(r)) return 'work';
  if (/^friend$/.test(r) || /classmate/.test(r)) return 'friend';
  // Family kin
  if (/sister|brother|niece|nephew|wife|husband|son|daughter|cousin|mother|mommy|mom|father|daddy|dad|auntie|aunt|uncle|tito|tita|grand|in.?law/.test(r)) return 'family';
  return 'other';
}

const stmts = {
  findDead:   db.prepare('SELECT id FROM repository_of_dead WHERE family_id = ? AND lower(full_name) = lower(?)'),
  insDead:    db.prepare('INSERT INTO repository_of_dead (family_id,added_by_user_id,full_name,relationship,brief_story) VALUES (?,?,?,?,?)'),
  findSick:   db.prepare("SELECT id FROM prayer_sick WHERE family_id = ? AND lower(person_name) = lower(?) AND status = 'active'"),
  insSick:    db.prepare('INSERT INTO prayer_sick (family_id,added_by_user_id,person_name,relationship,intention,date_added) VALUES (?,?,?,?,?,?)'),
  findPerson: db.prepare('SELECT id FROM prayer_people WHERE family_id = ? AND lower(full_name) = lower(?)'),
  insPerson:  db.prepare('INSERT INTO prayer_people (family_id,added_by_user_id,full_name,relationship,category) VALUES (?,?,?,?,?)')
};

const today = new Date().toISOString().slice(0, 10);
let addedDead = 0, skipDead = 0, addedSick = 0, skipSick = 0, addedPpl = 0, skipPpl = 0;

const tx = db.transaction(() => {
  for (const r of buckets['eternal repose']) {
    const name = cleanName(r.name);
    if (!name) continue;
    if (stmts.findDead.get(owner.family_id, name)) { skipDead++; continue; }
    stmts.insDead.run(owner.family_id, owner.id, name, r.rel || null, r.rel || null);
    addedDead++;
  }
  for (const r of buckets['health']) {
    const name = cleanName(r.name);
    if (!name) continue;
    if (stmts.findSick.get(owner.family_id, name)) { skipSick++; continue; }
    stmts.insSick.run(owner.family_id, owner.id, name, r.rel || null, 'Pray for healing.', today);
    addedSick++;
  }
  for (const r of buckets['general intercession']) {
    const name = cleanName(r.name);
    if (!name) continue;
    if (stmts.findPerson.get(owner.family_id, name)) { skipPpl++; continue; }
    stmts.insPerson.run(owner.family_id, owner.id, name, r.rel || null, categoryFor(r.rel));
    addedPpl++;
  }
});
tx();

console.log('DONE.');
console.log('  Repository of Dead: +' + addedDead + ' added, ' + skipDead + ' skipped (already there)');
console.log('  Sick list:          +' + addedSick + ' added, ' + skipSick + ' skipped');
console.log('  Our People:         +' + addedPpl + ' added, ' + skipPpl + ' skipped');
db.close();
