const { getDB, saveDB } = require("../database");

const FoundDocumentModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM found_documents ORDER BY date DESC");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(data) {
    const db = getDB();
    const { id, type, owner_name, number, location, status, date, declared_by, notified } = data;
    db.run(
      "INSERT INTO found_documents (id, type, owner_name, number, location, status, date, declared_by, notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, type, owner_name, number, location || "", status || "En attente", date, declared_by || "", notified ? 1 : 0]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM found_documents WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  },

  markNotified(id) {
    const db = getDB();
    db.run("UPDATE found_documents SET notified = 1 WHERE id = ?", [id]);
    saveDB();
  }
};

module.exports = FoundDocumentModel;