// Heavenward seed runner. Loads all data modules into the SQLite DB.
// Idempotent: deletes and re-inserts content tables; preserves user/family rows.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH.replace(/^\.\//, ''))
  : path.join(__dirname, 'heavenward.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const mysteries = require('./data/mysteries');
const saints = require('./data/saints');
const calendar = require('./data/calendar');
const whispers = [].concat(
  require('./data/whispers_part1'),
  require('./data/whispers_part2'),
  require('./data/whispers_part3'),
  require('./data/whispers_part4')
);

console.log('Heavenward seed -> ' + dbPath);
console.log('  mysteries: ' + mysteries.length);
console.log('  saints:    ' + saints.length);
console.log('  whispers:  ' + whispers.length);

const tx = db.transaction(() => {
  // Prayer hierarchy config
  db.prepare('DELETE FROM prayer_hierarchy_config').run();
  const hier = db.prepare('INSERT INTO prayer_hierarchy_config (level,label,notification_immediate,surfaces_morning,rosary_frequency,requires_parent_approval) VALUES (?,?,?,?,?,?)');
  hier.run(1, 'Emergency', 1, 1, 'always', 1);
  hier.run(2, 'Urgent', 0, 1, 'daily', 0);
  hier.run(3, 'Active', 0, 0, 'weekly', 0);
  hier.run(4, 'Ongoing', 0, 0, 'monthly', 0);

  // Mysteries
  db.prepare('DELETE FROM rosary_mysteries').run();
  const m = db.prepare('INSERT INTO rosary_mysteries (set_name,mystery_number,mystery_name,scripture_ref,reflection,decade_question,age_tier) VALUES (@set_name,@mystery_number,@mystery_name,@scripture_ref,@reflection,@decade_question,@age_tier)');
  for (const row of mysteries) m.run(Object.assign({ age_tier: 'all' }, row));

  // Saints
  db.prepare('DELETE FROM saints').run();
  const s = db.prepare('INSERT INTO saints (slug,name,feast_day,category,era,nationality,patron_of,brief,full_story_child,full_story_teen,full_story_adult,key_quote,theology_tags,age_appropriate) VALUES (@slug,@name,@feast_day,@category,@era,@nationality,@patron_of,@brief,@full_story_child,@full_story_teen,@full_story_adult,@key_quote,@theology_tags,@age_appropriate)');
  for (const row of saints) s.run(row);

  // Whispers
  db.prepare('DELETE FROM whisper_library').run();
  const w = db.prepare('INSERT INTO whisper_library (situation_tags,age_tiers,vocations,liturgical_contexts,scripture_text,scripture_ref,saint_name,saint_text,truth_text,doctrinal_tags,ccc_ref,approved_by_bryan) VALUES (@situation_tags,@age_tiers,@vocations,@liturgical_contexts,@scripture_text,@scripture_ref,@saint_name,@saint_text,@truth_text,@doctrinal_tags,@ccc_ref,@approved_by_bryan)');
  for (const row of whispers) w.run(Object.assign({ vocations: 'all', liturgical_contexts: 'all' }, row));

  // Liturgical calendar — current and next year
  const now = new Date();
  const cy = now.getUTCFullYear();
  db.prepare('DELETE FROM liturgical_calendar').run();
  const c = db.prepare('INSERT OR REPLACE INTO liturgical_calendar (date,season,feast_name,feast_rank,saint_slug,lectionary_year,gospel_ref,gospel_question) VALUES (@date,@season,@feast_name,@feast_rank,@saint_slug,@lectionary_year,@gospel_ref,@gospel_question)');
  const years = [cy - 1, cy, cy + 1];
  for (const y of years) {
    const days = calendar.generateYear(y);
    for (const day of days) c.run(day);
  }

  // Seed Manubag family if none exists.
  const fam = db.prepare('SELECT id FROM families WHERE name = ?').get('Manubag');
  let familyId;
  if (!fam) {
    const r = db.prepare('INSERT INTO families (name,patron_saint_slug,country_code) VALUES (?,?,?)').run('Manubag', 'lorenzo-ruiz', 'PH');
    familyId = r.lastInsertRowid;
  } else {
    familyId = fam.id;
  }

  // Seed Tatay & Nanay if not present.
  const seedUser = (email, name, role, pwHash, patron, dob) => {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return existing.id;
    const r = db.prepare('INSERT INTO users (email,display_name,password_hash,role,family_id,patron_saint_slug,date_of_birth,age_tier,vocation) VALUES (?,?,?,?,?,?,?,?,?)').run(email, name, pwHash, role, familyId, patron, dob, 'adult', 'married');
    return r.lastInsertRowid;
  };
  const hash = bcrypt.hashSync('heavenward2026', 10);
  seedUser('tatay@manubag.ph', 'Bryan Eleazar Loyola Manubag', 'tatay', hash, 'lorenzo-ruiz', '1980-01-01');
  seedUser('nanay@manubag.ph', 'Darryl Panganiban Pascua Manubag', 'nanay', hash, 'mary', '1980-01-01');

  // Seed founding family patron saints into Repository of the Dead as honor entries (is_family_patron=1).
  const honorExists = db.prepare('SELECT id FROM repository_of_dead WHERE family_id = ? AND is_family_patron = 1').all(familyId);
  if (honorExists.length === 0) {
    const ins = db.prepare('INSERT INTO repository_of_dead (family_id,added_by_user_id,full_name,relationship,brief_story,is_family_patron,death_date) VALUES (?,?,?,?,?,1,?)');
    const tatayId = db.prepare('SELECT id FROM users WHERE email = ?').get('tatay@manubag.ph').id;
    ins.run(familyId, tatayId, 'St. Lorenzo Ruiz', 'family patron saint', 'First Filipino saint. Martyred in Nagasaki 1637 for refusing to deny Christ.', '1637-09-28');
    ins.run(familyId, tatayId, 'Blessed Pedro Calungsod', 'family patron saint', 'Visayan teenage catechist martyred in Guam 1672 alongside Bl. Diego Luis de San Vitores.', '1672-04-02');
  }
});
tx();

console.log('Seed complete.');
const counts = {
  hierarchy: db.prepare('SELECT COUNT(*) c FROM prayer_hierarchy_config').get().c,
  mysteries: db.prepare('SELECT COUNT(*) c FROM rosary_mysteries').get().c,
  saints:    db.prepare('SELECT COUNT(*) c FROM saints').get().c,
  whispers:  db.prepare('SELECT COUNT(*) c FROM whisper_library').get().c,
  calendar:  db.prepare('SELECT COUNT(*) c FROM liturgical_calendar').get().c,
  families:  db.prepare('SELECT COUNT(*) c FROM families').get().c,
  users:     db.prepare('SELECT COUNT(*) c FROM users').get().c,
  dead:      db.prepare('SELECT COUNT(*) c FROM repository_of_dead').get().c
};
console.log('Counts:', counts);
db.close();
