const { getDB, saveDB } = require("../database");
const bcrypt = require("bcryptjs");

const UserModel = {
  create(email, password, name, phone, city) {
    const db = getDB();
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)", [email, hash, name, phone || "", city || ""]);
    saveDB();
    return this.findByEmail(email);
  },

  findById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT id, email, name, phone, city FROM users WHERE id = ?");
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

  verifyPassword(plainPassword, hash) {
    return bcrypt.compareSync(plainPassword, hash);
  }
};

module.exports = UserModel;
