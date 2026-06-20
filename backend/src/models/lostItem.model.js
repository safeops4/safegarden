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
    const { id, name, description, status, date, user_id, photo, qr_data } = data;
    db.run(
      "INSERT INTO lost_items (id, name, description, status, date, user_id, photo, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, description, status || "En recherche", date, user_id || 0, photo || "", qr_data || ""]
    );
    saveDB();
    const stmt = db.prepare("SELECT * FROM lost_items WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  },

  getById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM lost_items WHERE id = ?");
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
    for (const key of ["status", "name", "description"]) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      db.run(`UPDATE lost_items SET ${fields.join(", ")} WHERE id = ?`, values);
      saveDB();
    }
    return this.getById(id);
  }
};

module.exports = LostItemModel;