const AlertModel = require("../models/alert.model");
const DeviceModel = require("../models/device.model");
const { scheduleEscalation } = require("./alert.controller");

const activeAlerts = {};

const Esp32Controller = {
  heartbeat(req, res) {
    const { deviceId, battery } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    DeviceModel.update({
      status: "Connecté",
      battery: battery || 100,
      last_sync: new Date().toISOString()
    });
    const alertActive = !!activeAlerts[deviceId];
    res.json({ success: true, status: alertActive ? "ALERT_ACTIVE" : "IDLE" });
  },

  buttonDown(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const device = DeviceModel.get();

    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: deviceId,
      esp32_id: deviceId,
      location: `Abidjan (${device.latitude}, ${device.longitude})`,
      status: "PENDING",
      message: "Bouton SOS enfoncé - Compte à rebours 3s",
      date: new Date().toISOString()
    });

    DeviceModel.update({ status: "ALERTE PENDING" });

    activeAlerts[deviceId] = {
      alertId: alert.id,
      confirmed: false,
      pressedAt: Date.now()
    };

    res.json({
      success: true,
      alertId: alert.id,
      message: "Bouton détecté. Maintenez 3s pour confirmer l'alerte SOS."
    });
  },

  buttonUp(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const session = activeAlerts[deviceId];
    if (!session) {
      return res.json({ success: true, message: "Aucune alerte active" });
    }

    const wasConfirmed = session.confirmed;
    delete activeAlerts[deviceId];

    if (!wasConfirmed) {
      AlertModel.resolve(session.alertId);
      DeviceModel.update({ status: "Connecté" });
      return res.json({
        success: true,
        confirmed: false,
        message: "Alerte annulée (bouton relâché avant 3s)."
      });
    }

    return res.json({
      success: true,
      confirmed: true,
      message: "Alerte déjà confirmée."
    });
  },

  confirmSos(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const session = activeAlerts[deviceId];
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

    scheduleEscalation(session.alertId, deviceId);

    res.json({
      success: true,
      alertId: session.alertId,
      message: "SOS confirmé. Escamotage des secours démarré."
    });
  },

  legacyAlert(req, res) {
    const device = DeviceModel.get();
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: req.body.user || "Bracelet SG001",
      location: req.body.location || `Abidjan (Simulé: ${device.latitude}, ${device.longitude})`,
      status: "URGENT",
      message: req.body.message || "Signal discret reçu",
      date: new Date().toISOString()
    });
    DeviceModel.update({ status: "ALERTE SOS" });
    scheduleEscalation(alert.id);
    res.json({
      success: true,
      message: "Signal reçu, escalade démarrée"
    });
  }
};

module.exports = Esp32Controller;