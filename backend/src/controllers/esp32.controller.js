const AlertModel = require("../models/alert.model");
const DeviceModel = require("../models/device.model");
const Esp32Model = require("../models/esp32.model");
const UserModel = require("../models/user.model");
const { scheduleEscalation, cancelEscalation } = require("./alert.controller");
const crypto = require("crypto");

const activeAlerts = {};

const Esp32Controller = {
  generatePairingCode(req, res) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentification requise" });
    }
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const esp32Id = "ESP32-" + code.slice(0, 4);
    const esp32 = Esp32Model.register({
      id: esp32Id,
      userId: req.user.id,
      name: `Bracelet ${req.user.name}`,
      pairingCode: code,
      firmwareVersion: "1.0"
    });
    res.json({ success: true, esp32: { id: esp32.id, pairingCode: code } });
  },

  pair(req, res) {
    const { pairingCode, esp32Id, battery, firmwareVersion } = req.body;
    if (!pairingCode) {
      return res.status(400).json({ success: false, message: "Code d'appairage requis" });
    }
    const existing = Esp32Model.findByPairingCode(pairingCode);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Code d'appairage invalide" });
    }
    const updated = Esp32Model.register({
      id: esp32Id || existing.id,
      userId: existing.user_id,
      name: existing.name,
      pairingCode: "",
      firmwareVersion: firmwareVersion || "1.0"
    });
    res.json({ success: true, esp32: { id: updated.id, userId: updated.user_id } });
  },

  heartbeat(req, res) {
    const { esp32Id, battery } = req.body;
    if (!esp32Id) {
      return res.status(400).json({ success: false, message: "esp32Id requis" });
    }
    const esp32 = Esp32Model.findById(esp32Id);
    if (!esp32) {
      return res.status(404).json({ success: false, message: "ESP32 non trouvé. Appairez d'abord." });
    }
    Esp32Model.updateHeartbeat(esp32Id, battery || 100);
    const alertActive = !!activeAlerts[esp32Id];
    res.json({ success: true, status: alertActive ? "ALERT_ACTIVE" : "IDLE" });
  },

  buttonDown(req, res) {
    const { esp32Id } = req.body;
    if (!esp32Id) {
      return res.status(400).json({ success: false, message: "esp32Id requis" });
    }
    const esp32 = Esp32Model.findById(esp32Id);
    if (!esp32) {
      return res.status(404).json({ success: false, message: "ESP32 non trouvé" });
    }
    const user = UserModel.findById(esp32.user_id);
    const device = DeviceModel.get();

    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: user ? user.name : esp32.name,
      user_id: esp32.user_id,
      esp32_id: esp32Id,
      location: `Abidjan (${device.latitude}, ${device.longitude})`,
      status: "PENDING",
      message: "Bouton SOS enfoncé - Compte à rebours de confirmation",
      date: new Date().toISOString()
    });

    DeviceModel.update({ status: "ALERTE PENDING" });

    activeAlerts[esp32Id] = {
      alertId: alert.id,
      confirmed: false,
      pressedAt: Date.now(),
      timers: []
    };

    res.json({
      success: true,
      alertId: alert.id,
      message: "Bouton détecté. Maintenez 3s pour confirmer l'alerte SOS."
    });
  },

  buttonUp(req, res) {
    const { esp32Id } = req.body;
    if (!esp32Id) {
      return res.status(400).json({ success: false, message: "esp32Id requis" });
    }
    const session = activeAlerts[esp32Id];
    if (!session) {
      return res.json({ success: true, message: "Aucune alerte active à annuler" });
    }

    const elapsed = Date.now() - session.pressedAt;
    const wasConfirmed = session.confirmed;

    delete activeAlerts[esp32Id];

    if (!wasConfirmed) {
      AlertModel.resolve(session.alertId);
      DeviceModel.update({ status: "Connecté" });
      return res.json({
        success: true,
        confirmed: false,
        elapsed: elapsed,
        message: "Alerte annulée (bouton relâché avant 3s)."
      });
    }

    return res.json({
      success: true,
      confirmed: true,
      message: "Alerte déjà confirmée, escamotage en cours."
    });
  },

  confirmSos(req, res) {
    const { esp32Id } = req.body;
    if (!esp32Id) {
      return res.status(400).json({ success: false, message: "esp32Id requis" });
    }
    const session = activeAlerts[esp32Id];
    if (!session) {
      return res.status(404).json({ success: false, message: "Aucune alerte en attente" });
    }

    session.confirmed = true;

    const alert = AlertModel.getById(session.alertId);
    if (alert) {
      AlertModel.escalate(session.alertId, {
        time: new Date().toISOString(),
        stage: "CONFIRMED",
        appendMessage: " | ✅ SOS CONFIRMÉ après maintien 3s. Escamotage des secours en cours."
      });
      DeviceModel.update({ status: "ALERTE SOS" });
    }

    scheduleEscalation(session.alertId, esp32Id);

    res.json({
      success: true,
      alertId: session.alertId,
      message: "SOS confirmé. Escamotage des secours démarré."
    });
  },

  getStatus(req, res) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Authentification requise" });
    }
    const esp32s = Esp32Model.findByUserId(req.user.id);
    const data = esp32s.map(e => ({
      id: e.id,
      name: e.name,
      pairedAt: e.paired_at,
      lastSeen: e.last_seen,
      battery: e.battery,
      firmwareVersion: e.firmware_version,
      paired: !e.pairing_code,
      active: !!activeAlerts[e.id]
    }));
    res.json(data);
  },

  legacyAlert(req, res) {
    const device = DeviceModel.get();
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: req.body.user || "Bracelet SG001",
      location: req.body.location || `Abidjan (Simulé: ${device.latitude}, ${device.longitude})`,
      status: "URGENT",
      message: req.body.message || "Signal discret reçu (Bouton d'urgence)",
      date: new Date().toISOString()
    });

    DeviceModel.update({ status: "ALERTE SOS" });
    console.log("ESP32 Alert Received:", alert);
    scheduleEscalation(alert.id);

    res.json({
      success: true,
      message: "Signal discret reçu, compte à rebours d'escalade démarré"
    });
  }
};

module.exports = Esp32Controller;