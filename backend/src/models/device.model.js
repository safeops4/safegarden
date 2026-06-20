const { getDB, saveDB } = require("../database");

const DeviceModel = {
  get(deviceId) {
    const db = getDB();
    const id = deviceId || "SG001";
    const stmt = db.prepare("SELECT * FROM device WHERE id = ?");
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return transform(row);
    }
    stmt.free();
    return null;
  },

  getByUserId(userId) {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM device WHERE user_id = ?");
    stmt.bind([userId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return transform(row);
    }
    stmt.free();
    return null;
  },

  update(data, deviceId) {
    const db = getDB();
    const id = deviceId || "SG001";
    const current = this.get(id);
    if (!current) return null;
    const merged = { ...current, ...data, last_sync: new Date().toISOString() };

    const fields = [];
    const values = [];
    for (const key of ["status", "battery", "latitude", "longitude", "last_sync", "deactivated_until"]) {
      if (merged[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(merged[key]);
      }
    }
    if (fields.length > 0) {
      values.push(id);
      db.run(`UPDATE device SET ${fields.join(", ")} WHERE id = ?`, values);
      saveDB();
    }
    return this.get(id);
  }
};

function transform(row) {
  return {
    id: row.id,
    status: row.status,
    battery: row.battery,
    latitude: row.latitude,
    longitude: row.longitude,
    lastSync: row.last_sync,
    userId: row.user_id,
    deactivatedUntil: row.deactivated_until || ""
  };
}

module.exports = DeviceModel;