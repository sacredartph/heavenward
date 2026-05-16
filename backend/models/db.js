// Single shared SQLite connection for the Heavenward backend.
const Database = require('better-sqlite3');
const path = require('path');

// Always resolve relative to the project root, regardless of cwd
// (the server may be launched from any directory).
const projectRoot = path.join(__dirname, '..', '..');
const dbPath = process.env.DB_PATH
  ? path.resolve(projectRoot, process.env.DB_PATH.replace(/^\.\//, ''))
  : path.join(projectRoot, 'database', 'heavenward.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
