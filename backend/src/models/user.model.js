const { getDB, saveDB } = require("../database");
const bcrypt = require("bcryptjs");

const UserModel = {
  create(email, password, name) {
    const db = getDB();
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [email, hash, name]);
    saveDB();
    return { email, name };
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
