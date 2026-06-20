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
    const { id, type, ownerName, number, status, date, user_id, qr_data } = data;
    db.run(
      "INSERT INTO lost_documents (id, type, owner_name, number, status, date, user_id, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, type, ownerName, number, status || "En attente", date, user_id || 0, qr_data || ""]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM lost_documents WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  },

  getById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM lost_documents WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  update(id, data) {
    const db = getDB();
    const fields = [];
    const values = [];
    for (const key of ["status", "type", "owner_name", "number"]) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      db.run(`UPDATE lost_documents SET ${fields.join(", ")} WHERE id = ?`, values);
      saveDB();
    }
    return this.getById(id);
  }
};

module.exports = LostDocumentModel;