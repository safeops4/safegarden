const AlertModel = require("../models/alert.model");
const ContactModel = require("../models/contact.model");
const DeviceModel = require("../models/device.model");
const NotificationService = require("../services/notification.service");

const escalationTimers = {};

function scheduleEscalation(alertId, esp32Id) {
  console.log(`[ESCALATION] Alerte ${alertId} confirmée. Phases: Police(0s) → Pompiers(60s) → Forces spéciales+contacts(180s)`);

  AlertModel.updateStage(alertId, "POLICE_NOTIFIED", "Police nationale notifiée");

  const timers = [];

  const t1 = setTimeout(() => {
    const alert = AlertModel.getById(alertId);
    if (alert && alert.status !== "RÉSOLU") {
      AlertModel.updateStage(alertId, "POMPIERS_NOTIFIED", "⚠️ Escalade 1min - Pompiers notifiés");
      DeviceModel.update({ status: "ALERTE ESCALADÉE" });
      console.log(`[ESCALATION 1min] ${alertId} → Pompiers`);
    } else {
      console.log(`[ESCALATION 1min] ${alertId} résolue, pompiers non notifiés.`);
    }
  }, 60000);
  timers.push(t1);

  const t2 = setTimeout(async () => {
    const alert = AlertModel.getById(alertId);
    if (alert && alert.status !== "RÉSOLU") {
      const contacts = ContactModel.getAll();
      const contactsStr = contacts.length > 0
        ? contacts.map(c => `${c.name} (${c.phone})`).join(", ")
        : "Aucun contact d'urgence";
      AlertModel.updateStage(alertId, "FORCES_CONTACTS_NOTIFIED",
        `⚠️ ESCALADE 3min - Forces spéciales + Contacts [${contactsStr}]`);
      DeviceModel.update({ status: "ALERTE MAJEURE" });

      if (contacts.length > 0) {
        await NotificationService.notifyEmergencyContacts(contacts, alert);
      }

      if (esp32Id) {
        const device = DeviceModel.get();
        if (device) {
          console.log(`[NOTIFY] Alerte ${alertId} - Notification utilisateur du bracelet ${esp32Id}`);
        }
      }

      console.log(`[ESCALATION 3min] ${alertId} → Forces spéciales + contacts`);
    } else {
      console.log(`[ESCALATION 3min] ${alertId} résolue, escalation 3min annulée.`);
    }
  }, 180000);
  timers.push(t2);

  escalationTimers[alertId] = timers;
}

function cancelEscalation(alertId) {
  const timers = escalationTimers[alertId];
  if (timers) {
    timers.forEach(t => clearTimeout(t));
    delete escalationTimers[alertId];
    console.log(`[ESCALATION CANCELLED] Tous les timers pour ${alertId} annulés.`);
  }
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
    cancelEscalation(id);

    const activeUrgent = AlertModel.getActiveUrgentCount();
    if (activeUrgent === 0) {
      DeviceModel.update({ status: "Connecté" });
    }

    console.log(`[RESOLVED] Alerte ${id} résolue.`);
    res.json({ success: true, alert: AlertModel.getById(id) });
  }
};

module.exports = { AlertController, scheduleEscalation, cancelEscalation };