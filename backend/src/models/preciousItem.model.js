const { getDB, saveDB } = require("../database");

const PreciousItemModel = {
  getAll(userId) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM precious_items WHERE user_id = ? ORDER BY date DESC");
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM precious_items WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  create(data) {
    const db = getDB();
    const { id, name, description, photo, qr_data, user_id, status, date } = data;
    db.run(
      "INSERT INTO precious_items (id, name, description, photo, qr_data, user_id, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, description, photo || "", qr_data || "", user_id || 0, status || "En sécurité", date]
    );
    saveDB();
    return this.getById(id);
  },

  update(id, data) {
    const db = getDB();
    const current = this.getById(id);
    if (!current) return null;
    const merged = { ...current, ...data };
    db.run(
      "UPDATE precious_items SET name = ?, description = ?, photo = ?, status = ? WHERE id = ?",
      [merged.name, merged.description, merged.photo, merged.status, id]
    );
    saveDB();
    return this.getById(id);
  },

  remove(id) {
    const db = getDB();
    db.run("DELETE FROM precious_items WHERE id = ?", [id]);
    saveDB();
  }
};

module.exports = PreciousItemModel;