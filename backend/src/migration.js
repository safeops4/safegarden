const fs = require("fs");
const path = require("path");
const { getDB, saveDB } = require("./database");
const bcrypt = require("bcryptjs");

const JSON_PATH = path.join(__dirname, "..", "database.json");

function migrateFromJson() {
  if (!fs.existsSync(JSON_PATH)) return;

  console.log("[MIGRATION] Import de database.json vers SQLite...");
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const db = getDB();

  if (data.users) {
    for (const u of data.users) {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?");
      existing.bind([u.email]);
      if (!existing.step()) {
        existing.free();
        const hash = bcrypt.hashSync(u.password, 10);
        db.run("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [u.email, hash, u.name]);
      } else {
        existing.free();
      }
    }
  }

  if (data.alerts) {
    for (const a of data.alerts) {
      db.run(
        "INSERT OR IGNORE INTO alerts (id, user, location, status, message, date) VALUES (?, ?, ?, ?, ?, ?)",
        [a.id, a.user, a.location, a.status || "URGENT", a.message, a.date || new Date().toISOString()]
      );
    }
  }

  if (data.lostItems) {
    for (const i of data.lostItems) {
      db.run(
        "INSERT OR IGNORE INTO lost_items (id, name, description, status, date) VALUES (?, ?, ?, ?, ?)",
        [i.id, i.name, i.description, i.status, i.date || new Date().toISOString()]
      );
    }
  }

  if (data.lostDocuments) {
    for (const d of data.lostDocuments) {
      db.run(
        "INSERT OR IGNORE INTO lost_documents (id, type, owner_name, number, status, date) VALUES (?, ?, ?, ?, ?, ?)",
        [d.id, d.type, d.ownerName, d.number, d.status, d.date || new Date().toISOString()]
      );
    }
  }

  if (data.contacts) {
    for (const c of data.contacts) {
      db.run(
        "INSERT OR IGNORE INTO contacts (id, name, phone, email, relation) VALUES (?, ?, ?, ?, ?)",
        [c.id, c.name, c.phone, c.email || "", c.relation || "Contact"]
      );
    }
  }

  if (data.device) {
    const dev = data.device;
    db.run(
      "INSERT OR IGNORE INTO device (id, status, battery, latitude, longitude, last_sync) VALUES (?, ?, ?, ?, ?, ?)",
      [dev.id || "SG001", dev.status || "Connecté", dev.battery || 100, dev.latitude || 0, dev.longitude || 0, dev.lastSync || new Date().toISOString()]
    );
  }

  saveDB();

  fs.renameSync(JSON_PATH, JSON_PATH + ".backup");
  console.log("[MIGRATION] Import terminé. database.json renommé en database.json.backup");
}

module.exports = { migrateFromJson };
