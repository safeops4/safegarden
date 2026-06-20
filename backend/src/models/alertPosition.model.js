const { getDB } = require("../database");

const AlertPositionModel = {
  getByAlertId(alertId) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM alert_positions WHERE alert_id = ? ORDER BY timestamp ASC");
    stmt.bind([alertId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  create(alertId, latitude, longitude) {
    const db = getDB();
    db.run(
      "INSERT INTO alert_positions (alert_id, latitude, longitude) VALUES (?, ?, ?)",
      [alertId, latitude, longitude]
    );
  }
};

module.exports = AlertPositionModel;