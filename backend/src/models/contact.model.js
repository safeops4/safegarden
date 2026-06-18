const { getDB, saveDB } = require("../database");

const ContactModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM contacts");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(data) {
    const db = getDB();
    const { id, name, phone, email, relation } = data;
    db.run(
      "INSERT INTO contacts (id, name, phone, email, relation) VALUES (?, ?, ?, ?, ?)",
      [id, name, phone, email || "", relation || "Contact"]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM contacts WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  },

  remove(id) {
    const db = getDB();
    db.run("DELETE FROM contacts WHERE id = ?", [id]);
    saveDB();
  }
};

module.exports = ContactModel;
