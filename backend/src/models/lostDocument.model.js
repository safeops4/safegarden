const { getDB, saveDB } = require("../database");

const LostDocumentModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM lost_documents ORDER BY date DESC");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(data) {
    const db = getDB();
    const { id, type, ownerName, number, status, date } = data;
    db.run(
      "INSERT INTO lost_documents (id, type, owner_name, number, status, date) VALUES (?, ?, ?, ?, ?, ?)",
      [id, type, ownerName, number, status || "En attente", date]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM lost_documents WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
};

module.exports = LostDocumentModel;
