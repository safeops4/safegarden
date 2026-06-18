const { getDB, saveDB } = require("../database");

const AlertModel = {
  getAll() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM alerts ORDER BY date DESC");
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(transform(row));
    }
    stmt.free();
    return results;
  },

  getById(id) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM alerts WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return transform(row);
    }
    stmt.free();
    return null;
  },

  create(data) {
    const db = getDB();
    const { id, user, location, status, message, date } = data;
    db.run(
      "INSERT INTO alerts (id, user, location, status, message, date) VALUES (?, ?, ?, ?, ?, ?)",
      [id, user, location, status || "URGENT", message, date]
    );
    saveDB();
    return this.getById(id);
  },

  resolve(id) {
    const db = getDB();
    db.run("UPDATE alerts SET status = 'RÉSOLU' WHERE id = ?", [id]);
    saveDB();
    return this.getById(id);
  },

  escalate(id, escalationInfo) {
    const db = getDB();
    db.run(
      "UPDATE alerts SET escalated = 1, escalation_time = ?, escalation_stage = ?, escalation_level = 1, message = message || ? WHERE id = ?",
      [escalationInfo.time, escalationInfo.stage || "", escalationInfo.appendMessage, id]
    );
    saveDB();
    return this.getById(id);
  },

  updateStage(id, stage, appendMessage) {
    const db = getDB();
    const current = this.getById(id);
    const level = stage === "POLICE_NOTIFIED" ? 1 : stage === "POMPIERS_NOTIFIED" ? 2 : 3;
    db.run(
      "UPDATE alerts SET escalation_stage = ?, escalation_level = ?, message = message || ? WHERE id = ?",
      [stage, level, ` | ${appendMessage}`, id]
    );
    saveDB();
    return this.getById(id);
  },

  getActiveUrgentCount() {
    const db = getDB();
    const stmt = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'URGENT'");
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    return row.count;
  }
};

function transform(row) {
  return {
    id: row.id,
    user: row.user,
    location: row.location,
    status: row.status,
    message: row.message,
    escalated: !!row.escalated,
    escalationTime: row.escalation_time,
    date: row.date
  };
}

module.exports = AlertModel;
