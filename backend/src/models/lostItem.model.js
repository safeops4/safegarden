const { getDB, saveDB } = require("../database");

const LostItemModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM lost_items ORDER BY date DESC");
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(data) {
    const db = getDB();
    const { id, name, description, status, date } = data;
    db.run(
      "INSERT INTO lost_items (id, name, description, status, date) VALUES (?, ?, ?, ?, ?)",
      [id, name, description, status || "En recherche", date]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM lost_items WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
};

module.exports = LostItemModel;
