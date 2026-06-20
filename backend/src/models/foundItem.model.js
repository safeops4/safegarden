const { getDB, saveDB } = require("../database");

const FoundItemModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM found_items ORDER BY date DESC");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(data) {
    const db = getDB();
    const { id, name, description, location, status, date, declared_by } = data;
    db.run(
      "INSERT INTO found_items (id, name, description, location, status, date, declared_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, description, location || "", status || "En attente", date, declared_by || ""]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM found_items WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
};

module.exports = FoundItemModel;