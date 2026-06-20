const AlertModel = require("../models/alert.model");
const DeviceModel = require("../models/device.model");
const UserModel = require("../models/user.model");
const AlertPositionModel = require("../models/alertPosition.model");
const { scheduleEscalation } = require("./alert.controller");

const activeAlerts = {};

const Esp32Controller = {
  heartbeat(req, res) {
    const { deviceId, battery, latitude, longitude } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    DeviceModel.update({
      status: "Connecté",
      battery: battery || 100,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      last_sync: new Date().toISOString()
    }, deviceId);

    const alertActive = !!activeAlerts[deviceId];
    if (alertActive && latitude && longitude) {
      const session = activeAlerts[deviceId];
      AlertPositionModel.create(session.alertId, latitude, longitude);
    }

    res.json({ success: true, status: alertActive ? "ALERT_ACTIVE" : "IDLE" });
  },

  buttonDown(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const device = DeviceModel.get(deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: "Aucun appareil trouvé avec cet ID" });
    }

    const user = UserModel.findByDeviceId(deviceId);
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: user ? user.name : deviceId,
      user_id: user ? user.id : 0,
      esp32_id: deviceId,
      location: `Abidjan (${device.latitude}, ${device.longitude})`,
      status: "PENDING",
      message: "Bouton SOS enfoncé - Compte à rebours 3s",
      date: new Date().toISOString()
    });

    DeviceModel.update({ status: "ALERTE PENDING" }, deviceId);

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
      DeviceModel.update({ status: "Connecté" }, deviceId);
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
        appendMessage: " | ✅ SOS CONFIRMÉ après maintien 3s. Police + commissariats notifiés."
      });
      DeviceModel.update({ status: "ALERTE SOS" }, deviceId);
    }

    scheduleEscalation(session.alertId, deviceId);

    res.json({
      success: true,
      alertId: session.alertId,
      message: "SOS confirmé. Police et commissariats alertés."
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
  },

  forcedRemoval(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const device = DeviceModel.get(deviceId);
    const user = UserModel.findByDeviceId(deviceId);
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: user ? user.name : deviceId,
      user_id: user ? user.id : 0,
      esp32_id: deviceId,
      location: device ? `Abidjan (${device.latitude}, ${device.longitude})` : "Inconnue",
      status: "URGENT",
      message: "⚠️ RETRAIT FORCÉ du bracelet détecté ! Alerte immédiate.",
      date: new Date().toISOString()
    });
    DeviceModel.update({ status: "ALERTE RETRAIT FORCÉ" }, deviceId);
    scheduleEscalation(alert.id, deviceId);
    res.json({
      success: true,
      alertId: alert.id,
      message: "Retrait forcé détecté. Secours alertés."
    });
  },

  deactivate(req, res) {
    const { deviceId, hours } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    const duration = Math.min(Math.max(parseInt(hours) || 8, 1), 24);
    const until = new Date(Date.now() + duration * 3600000).toISOString();
    DeviceModel.update({ status: "DÉSACTIVÉ", deactivated_until: until }, deviceId);
    console.log(`[DEACTIVATE] ${deviceId} désactivé jusqu'à ${until}`);
    res.json({ success: true, deactivated_until: until, message: `Bracelet désactivé pour ${duration}h.` });
  },

  activate(req, res) {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "deviceId requis" });
    }
    DeviceModel.update({ status: "Connecté", deactivated_until: "" }, deviceId);
    res.json({ success: true, message: "Bracelet réactivé." });
  }
};

module.exports = Esp32Controller;