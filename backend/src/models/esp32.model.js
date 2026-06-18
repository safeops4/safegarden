const { getDB, saveDB } = require("../database");

const Esp32Model = {
  findByPairingCode(code) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM esp32_devices WHERE pairing_code = ?");
    stmt.bind([code]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  findByUserId(userId) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM esp32_devices WHERE user_id = ?");
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  findById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM esp32_devices WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  register(data) {
    const db = getDB();
    const { id, userId, name, pairingCode, firmwareVersion } = data;
    db.run(
      "INSERT OR REPLACE INTO esp32_devices (id, user_id, name, pairing_code, paired_at, last_seen, battery, firmware_version) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 100, ?)",
      [id, userId, name || "Bracelet ESP32", pairingCode, firmwareVersion || "1.0"]
    );
    saveDB();
    return this.findById(id);
  },

  updateHeartbeat(id, battery) {
    const db = getDB();
    db.run(
      "UPDATE esp32_devices SET last_seen = datetime('now'), battery = ? WHERE id = ?",
      [battery || 100, id]
    );
    saveDB();
  },

  remove(id) {
    const db = getDB();
    db.run("DELETE FROM esp32_devices WHERE id = ?", [id]);
    saveDB();
  }
};

module.exports = Esp32Model;