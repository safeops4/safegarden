const AlertModel = require("../models/alert.model");
const ContactModel = require("../models/contact.model");
const DeviceModel = require("../models/device.model");
const NotificationService = require("../services/notification.service");

function scheduleEscalation(alertId) {
  console.log(`[ESCALATION TIMER] Démarrage 3 min pour alerte: ${alertId}`);

  setTimeout(() => {
    const alert = AlertModel.getById(alertId);
    if (alert && alert.status === "URGENT") {
      const contacts = ContactModel.getAll();
      const contactsStr = contacts.length > 0
        ? contacts.map(c => `${c.name} (${c.phone})`).join(", ")
        : "Aucun contact d'urgence configuré";

      AlertModel.escalate(alertId, {
        time: new Date().toISOString(),
        appendMessage: ` | ⚠️ ESCALADE (3 MIN SANS RÉPONSE) : Contacts alertés : [${contactsStr}]`
      });

      DeviceModel.update({ status: "ALERTE ESCALADÉE" });

      NotificationService.notifyEmergencyContacts(contacts, alert);

      console.log(`[ESCALATION TRIGGERED] Alerte ${alertId} escaladée.`);
    } else {
      console.log(`[ESCALATION CANCELLED] Alerte ${alertId} résolue à temps.`);
    }
  }, 180000);
}

const AlertController = {
  getAll(req, res) {
    const alerts = AlertModel.getAll();
    res.json(alerts);
  },

  create(req, res) {
    const { message, status } = req.body;
    const device = DeviceModel.get();
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: "Console Admin",
      location: `Abidjan (Simulé: ${device.latitude}, ${device.longitude})`,
      status: status || "URGENT",
      message: message || "Alerte manuelle depuis le tableau de bord",
      date: new Date().toISOString()
    });

    if (alert.status === "URGENT") {
      DeviceModel.update({ status: "ALERTE SOS" });
      scheduleEscalation(alert.id);
    }

    res.json(alert);
  },

  resolve(req, res) {
    const { id } = req.params;
    const alert = AlertModel.getById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alerte non trouvée" });
    }

    AlertModel.resolve(id);
    const activeUrgent = AlertModel.getActiveUrgentCount();
    if (activeUrgent === 0) {
      DeviceModel.update({ status: "Connecté" });
    }

    console.log(`[RESOLVED] Alerte ${id} résolue.`);
    res.json({ success: true, alert: AlertModel.getById(id) });
  }
};

module.exports = { AlertController, scheduleEscalation };
