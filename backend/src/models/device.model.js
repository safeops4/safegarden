const { getDB, saveDB } = require("../database");

const DEFAULT_DEVICE = {
  id: "SG001",
  status: "Connecté",
  battery: 89,
  latitude: 5.3484,
  longitude: -3.9774,
  last_sync: new Date().toISOString()
};

const DeviceModel = {
  get() {
    const db = getDB();
    const stmt = db.prepare("SELECT * FROM device WHERE id = 'SG001'");
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return transform(row);
    }
    stmt.free();
    this.seed();
    return DEFAULT_DEVICE;
  },

  update(data) {
    const db = getDB();
    const current = this.get();
    const merged = { ...current, ...data, last_sync: new Date().toISOString() };
    db.run(
      `UPDATE device SET status = ?, battery = ?, latitude = ?, longitude = ?, last_sync = ? WHERE id = ?`,
      [merged.status, merged.battery, merged.latitude, merged.longitude, merged.last_sync, "SG001"]
    );
    saveDB();
    return this.get();
  },

  seed() {
    const db = getDB();
    db.run(
      "INSERT OR IGNORE INTO device (id, status, battery, latitude, longitude, last_sync) VALUES (?, ?, ?, ?, ?, ?)",
      [DEFAULT_DEVICE.id, DEFAULT_DEVICE.status, DEFAULT_DEVICE.battery, DEFAULT_DEVICE.latitude, DEFAULT_DEVICE.longitude, DEFAULT_DEVICE.last_sync]
    );
    saveDB();
  }
};

function transform(row) {
  return {
    id: row.id,
    status: row.status,
    battery: row.battery,
    latitude: row.latitude,
    longitude: row.longitude,
    lastSync: row.last_sync
  };
}

module.exports = DeviceModel;
