const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data.db");

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      city TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  try { db.run("ALTER TABLE alerts ADD COLUMN escalation_level INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE alerts ADD COLUMN escalation_stage TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE alerts ADD COLUMN user_id INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE alerts ADD COLUMN esp32_id TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN city TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN device_id TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN latitude REAL DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN longitude REAL DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE alerts ADD COLUMN latitude REAL DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE alerts ADD COLUMN longitude REAL DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE device ADD COLUMN user_id INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE device ADD COLUMN deactivated_until TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE lost_items ADD COLUMN user_id INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE lost_items ADD COLUMN photo TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE lost_items ADD COLUMN qr_data TEXT DEFAULT ''"); } catch(e) {}
  try { db.run("ALTER TABLE lost_documents ADD COLUMN user_id INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE lost_documents ADD COLUMN qr_data TEXT DEFAULT ''"); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'URGENT',
      message TEXT,
      escalated INTEGER DEFAULT 0,
      escalation_time TEXT,
      date TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lost_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'En recherche',
      date TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lost_documents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      number TEXT,
      status TEXT DEFAULT 'En attente',
      date TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS found_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT DEFAULT '',
      status TEXT DEFAULT 'En attente',
      date TEXT DEFAULT (datetime('now')),
      declared_by TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS found_documents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      number TEXT DEFAULT '',
      location TEXT DEFAULT '',
      status TEXT DEFAULT 'En attente',
      date TEXT DEFAULT (datetime('now')),
      declared_by TEXT DEFAULT '',
      notified INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alert_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (alert_id) REFERENCES alerts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS precious_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      qr_data TEXT DEFAULT '',
      user_id INTEGER DEFAULT 0,
      status TEXT DEFAULT 'En sécurité',
      date TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      relation TEXT DEFAULT 'Contact'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS device (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'Connecté',
      battery INTEGER DEFAULT 100,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      last_sync TEXT DEFAULT (datetime('now'))
    )
  `);

  saveDB();
  return db;
}

function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

function closeDB() {
  if (db) {
    saveDB();
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDB, saveDB, closeDB };
