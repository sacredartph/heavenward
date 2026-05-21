// Heavenward database schema initialization.
// Idempotent: safe to run multiple times.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH.replace(/^\.\//, ''))
  : path.join(__dirname, 'heavenward.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Heavenward DB init -> ' + dbPath);

const schema = [
  // Core
  `CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by_user_id INTEGER,
    patron_saint_slug TEXT,
    country_code TEXT DEFAULT 'PH',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'child',
    family_id INTEGER,
    bukidic_uid TEXT,
    age_tier TEXT,
    date_of_birth DATE,
    vocation TEXT DEFAULT 'single',
    patron_saint_slug TEXT,
    confirmation_name TEXT,
    baptism_date DATE,
    first_communion_date DATE,
    confirmation_date DATE,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )`,

  // Prayer ecosystem
  `CREATE TABLE IF NOT EXISTS repository_of_dead (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    nickname TEXT,
    relationship TEXT,
    birthdate DATE,
    death_date DATE,
    baptism_date DATE,
    brief_story TEXT,
    photo_placeholder_color TEXT DEFAULT '#C9A84C',
    is_family_patron INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS prayer_sick (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    person_name TEXT NOT NULL,
    relationship TEXT,
    intention TEXT NOT NULL,
    date_added DATE NOT NULL,
    status TEXT DEFAULT 'active',
    resolved_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS prayer_petitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    person_name TEXT,
    relationship TEXT,
    petition TEXT NOT NULL,
    category TEXT DEFAULT 'personal',
    level INTEGER NOT NULL DEFAULT 3,
    is_pinned INTEGER DEFAULT 0,
    date_added DATE NOT NULL,
    status TEXT DEFAULT 'active',
    resolved_at DATE,
    resolution_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS petition_carriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id INTEGER,
    accepted INTEGER DEFAULT 0,
    accepted_at DATETIME
  )`,

  `CREATE TABLE IF NOT EXISTS petition_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petition_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS prayer_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    person_name TEXT,
    original_intention TEXT,
    date_added DATE,
    date_resolved DATE,
    how_god_answered TEXT,
    anniversary_last_surfaced DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS prayer_thanksgiving (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    person_name TEXT,
    thanksgiving_text TEXT NOT NULL,
    linked_petition_id INTEGER,
    date_added DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS prayer_hierarchy_config (
    level INTEGER PRIMARY KEY,
    label TEXT NOT NULL,
    notification_immediate INTEGER DEFAULT 0,
    surfaces_morning INTEGER DEFAULT 1,
    rosary_frequency TEXT,
    requires_parent_approval INTEGER DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS rosary_cycle_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    walk_id INTEGER NOT NULL,
    stream TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    prayed_at DATETIME NOT NULL
  )`,

  // Walk
  `CREATE TABLE IF NOT EXISTS rosary_walks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    family_id INTEGER,
    mode TEXT DEFAULT 'solo',
    mystery_set TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    duration_seconds INTEGER,
    steps INTEGER DEFAULT 0,
    decades_completed INTEGER DEFAULT 0,
    tail_completed INTEGER DEFAULT 0,
    initiated_by INTEGER
  )`,

  `CREATE TABLE IF NOT EXISTS rosary_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    walk_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Whisper
  `CREATE TABLE IF NOT EXISTS whisper_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    situation_tags TEXT NOT NULL,
    age_tiers TEXT NOT NULL,
    vocations TEXT DEFAULT 'all',
    liturgical_contexts TEXT DEFAULT 'all',
    scripture_text TEXT NOT NULL,
    scripture_ref TEXT NOT NULL,
    saint_name TEXT NOT NULL,
    saint_text TEXT NOT NULL,
    truth_text TEXT NOT NULL,
    doctrinal_tags TEXT,
    ccc_ref TEXT,
    approved_by_bryan INTEGER DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS whisper_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    whisper_id INTEGER NOT NULL,
    moment_type TEXT,
    shown_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS doctrinal_exposure (
    user_id INTEGER NOT NULL,
    area TEXT NOT NULL,
    first_encountered DATE,
    times_encountered INTEGER DEFAULT 0,
    last_encountered DATE,
    PRIMARY KEY (user_id, area)
  )`,

  // Hours
  `CREATE TABLE IF NOT EXISTS hours_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    hour_type TEXT NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    completed INTEGER DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS moment_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    moment_type TEXT NOT NULL,
    free_text TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Hearth
  `CREATE TABLE IF NOT EXISTS hearth_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS hearth_candles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    repository_person_id INTEGER NOT NULL,
    lit_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS family_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    member_user_id INTEGER,
    type TEXT NOT NULL,
    milestone_date DATE NOT NULL,
    notes TEXT,
    annual INTEGER DEFAULT 1
  )`,

  // Saints
  `CREATE TABLE IF NOT EXISTS saints (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    feast_day TEXT NOT NULL,
    category TEXT NOT NULL,
    era TEXT,
    nationality TEXT,
    patron_of TEXT,
    brief TEXT NOT NULL,
    full_story_child TEXT,
    full_story_teen TEXT,
    full_story_adult TEXT NOT NULL,
    key_quote TEXT,
    theology_tags TEXT,
    age_appropriate TEXT DEFAULT 'all'
  )`,

  // Mysteries
  `CREATE TABLE IF NOT EXISTS rosary_mysteries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_name TEXT NOT NULL,
    mystery_number INTEGER NOT NULL,
    mystery_name TEXT NOT NULL,
    scripture_ref TEXT NOT NULL,
    reflection TEXT NOT NULL,
    decade_question TEXT NOT NULL,
    age_tier TEXT DEFAULT 'all'
  )`,

  // Liturgical calendar
  `CREATE TABLE IF NOT EXISTS liturgical_calendar (
    date TEXT PRIMARY KEY,
    season TEXT NOT NULL,
    feast_name TEXT,
    feast_rank TEXT,
    saint_slug TEXT,
    lectionary_year TEXT,
    gospel_ref TEXT,
    gospel_question TEXT
  )`,

  // Family prayer schedule (one row per family).
  // The "Heavenward Hours" - a Catholic family iteration of the Liturgy of the Hours.
  `CREATE TABLE IF NOT EXISTS family_schedule (
    family_id INTEGER PRIMARY KEY,
    morning_time     TEXT DEFAULT '06:00',
    midmorning_time  TEXT DEFAULT '09:00',
    angelus_time     TEXT DEFAULT '12:00',
    mercy_time       TEXT DEFAULT '15:00',
    rosary_time      TEXT DEFAULT '18:00',
    night_time       TEXT DEFAULT '21:00',
    active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Web Push subscriptions: one row per (user, device) - the browser
  // generates a different endpoint per install / per device.
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    family_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_pushed_at DATETIME
  )`,

  // Idempotency log so the cron does not push twice for the same prayer minute.
  `CREATE TABLE IF NOT EXISTS push_fired_log (
    family_id INTEGER NOT NULL,
    prayer_key TEXT NOT NULL,
    fired_date TEXT NOT NULL,
    fired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (family_id, prayer_key, fired_date)
  )`,

  // "Our People" - the family's ongoing prayer circle (living people we pray for).
  // The Repository of the Dead holds the deceased separately.
  // category: family | friend | godfamily | parish | work | acquaintance | other
  `CREATE TABLE IF NOT EXISTS prayer_people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    relationship TEXT,
    category TEXT DEFAULT 'other',
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Letter-to-God diary. 99.9% private: only the author can read their own rows.
  // No family/parent visibility. The 0.1% door (an Examen/Confession companion
  // export) is left for a later release - the schema does not differ.
  `CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    verse_ref TEXT,
    verse_text TEXT,
    prompt TEXT,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // The world we carry - intentions for events, wars, calamities, the Church at large.
  // Family-scoped, like petitions, but rendered as its own cycling section in The Book.
  `CREATE TABLE IF NOT EXISTS world_intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    category TEXT DEFAULT 'world',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

const idx = [
  `CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id)`,
  `CREATE INDEX IF NOT EXISTS idx_petitions_family ON prayer_petitions(family_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_sick_family ON prayer_sick(family_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_dead_family ON repository_of_dead(family_id)`,
  `CREATE INDEX IF NOT EXISTS idx_walks_user ON rosary_walks(user_id, started_at)`,
  `CREATE INDEX IF NOT EXISTS idx_walks_family ON rosary_walks(family_id, started_at)`,
  `CREATE INDEX IF NOT EXISTS idx_whisper_log_user ON whisper_log(user_id, shown_at)`,
  `CREATE INDEX IF NOT EXISTS idx_hours_user ON hours_log(user_id, logged_at)`,
  `CREATE INDEX IF NOT EXISTS idx_moment_user ON moment_log(user_id, logged_at)`,
  `CREATE INDEX IF NOT EXISTS idx_hearth_family ON hearth_posts(family_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_candles_family ON hearth_candles(family_id, lit_at)`,
  `CREATE INDEX IF NOT EXISTS idx_saints_feast ON saints(feast_day)`,
  `CREATE INDEX IF NOT EXISTS idx_mysteries_set ON rosary_mysteries(set_name, mystery_number)`
];

const tx = db.transaction(() => {
  for (const stmt of schema) db.prepare(stmt).run();
  for (const stmt of idx) db.prepare(stmt).run();
});
tx();

// Idempotent column migrations (SQLite ALTER TABLE only supports add-column;
// we add new family_schedule columns here if they don't yet exist).
function hasColumn(table, col) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some(r => r.name === col);
}
if (!hasColumn('family_schedule', 'midmorning_time')) {
  db.prepare(`ALTER TABLE family_schedule ADD COLUMN midmorning_time TEXT DEFAULT '09:00'`).run();
  console.log('migrated: family_schedule.midmorning_time');
}
if (!hasColumn('family_schedule', 'mercy_time')) {
  db.prepare(`ALTER TABLE family_schedule ADD COLUMN mercy_time TEXT DEFAULT '15:00'`).run();
  console.log('migrated: family_schedule.mercy_time');
}

// Diary + world-intentions indexes (added 2026-05-17 PHT).
db.prepare('CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, entry_date DESC)').run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_world_family ON world_intentions(family_id, active)').run();

console.log('Schema ready: ' + schema.length + ' tables, ' + idx.length + ' indexes.');
db.close();
