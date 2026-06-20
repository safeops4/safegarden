const { getDB, saveDB } = require("../database");
const bcrypt = require("bcryptjs");

const UserModel = {
  create(email, password, name, phone, city) {
    const db = getDB();
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)", [email, hash, name, phone || "", city || ""]);
    saveDB();
    const user = this.findByEmail(email);
    const deviceId = "SG" + String(user.id).padStart(3, "0");
    db.run("UPDATE users SET device_id = ? WHERE id = ?", [deviceId, user.id]);
    db.run("INSERT OR IGNORE INTO device (id, user_id, status, battery, latitude, longitude) VALUES (?, ?, 'Connecté', 100, 5.3484, -3.9774)", [deviceId, user.id]);
    saveDB();
    return this.findByEmail(email);
  },

  findById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT id, email, name, phone, city, device_id FROM users WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  findByEmail(email) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.getAsObject([email]);
    return row.id ? row : null;
  },

  findByPhone(phone) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM users WHERE phone = ?");
    stmt.bind([phone]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  findByDeviceId(deviceId) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM users WHERE device_id = ?");
    const row = stmt.getAsObject([deviceId]);
    return row.id ? row : null;
  },

  findByName(name) {
    const db = getDB();
    const stmt = db.prepare("SELECT id, email, name, phone, city, device_id FROM users WHERE LOWER(name) LIKE ?");
    stmt.bind([`%${name.toLowerCase()}%`]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT id, email, name, phone, city, device_id, latitude, longitude FROM users");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  updateLocation(userId, latitude, longitude) {
    const db = getDB();
    db.run("UPDATE users SET latitude = ?, longitude = ? WHERE id = ?", [latitude, longitude, userId]);
    saveDB();
  },

  verifyPassword(plainPassword, hash) {
    return bcrypt.compareSync(plainPassword, hash);
  }
};

module.exports = UserModel;