const AlertModel = require("../models/alert.model");
const ContactModel = require("../models/contact.model");
const DeviceModel = require("../models/device.model");
const UserModel = require("../models/user.model");
const AlertPositionModel = require("../models/alertPosition.model");
const NotificationService = require("../services/notification.service");
const { haversine } = require("../utils/geo");

const ALERT_RADIUS_KM = 5;
const escalationTimers = {};

function getNearbyUsers(lat, lng, radiusKm) {
  const all = UserModel.getAll();
  if (!lat || !lng) return all;
  return all.filter(u => {
    if (!u.latitude || !u.longitude) return false;
    return haversine(lat, lng, u.latitude, u.longitude) <= radiusKm;
  });
}

function scheduleEscalation(alertId, deviceId) {
  const alert = AlertModel.getById(alertId);
  console.log(`[ESCALATION] Alerte ${alertId}. Police(0s) → Pompiers(60s) → Voisinage ${ALERT_RADIUS_KM}km+contacts(180s)`);

  AlertModel.updateStage(alertId, "POLICE_NOTIFIED",
    "🚔 Police nationale et commissariats notifiés");

  const timers = [];

  const t1 = setTimeout(() => {
    const a = AlertModel.getById(alertId);
    if (a && a.status !== "RÉSOLU") {
      AlertModel.updateStage(alertId, "POMPIERS_NOTIFIED",
        "🚒 Escalade 1min - Pompiers notifiés");
      DeviceModel.update({ status: "ALERTE ESCALADÉE" }, deviceId);
      console.log(`[ESCALATION 1min] ${alertId} → Pompiers`);
    }
  }, 60000);
  timers.push(t1);

  const t2 = setTimeout(async () => {
    const a = AlertModel.getById(alertId);
    if (a && a.status !== "RÉSOLU") {
      const contacts = ContactModel.getAll();
      const contactsStr = contacts.length > 0
        ? contacts.map(c => `${c.name} (${c.phone})`).join(", ")
        : "Aucun contact d'urgence";

      const nearby = getNearbyUsers(a.latitude, a.longitude, ALERT_RADIUS_KM);
      const usersStr = nearby.length > 0
        ? nearby.map(u => `${u.name} (${u.phone || "SMS"})`).join(", ")
        : "Aucun utilisateur à proximité";

      AlertModel.updateStage(alertId, "ALL_NOTIFIED",
        `⚠️ ESCALADE 3min - Contacts [${contactsStr}] + Voisinage ${ALERT_RADIUS_KM}km [${usersStr}]`);
      DeviceModel.update({ status: "ALERTE MAJEURE" }, deviceId);

      if (contacts.length > 0) {
        await NotificationService.notifyEmergencyContacts(contacts, a);
      }

      for (const user of nearby) {
        if (user.phone) {
          await NotificationService.sendSMS(user.phone,
            `URGENT SafeGuardian: Alerte SOS à proximité (${a.user}) - ${a.location}. Zone: ${ALERT_RADIUS_KM}km. Soyez vigilants.`);
        }
        if (user.email) {
          await NotificationService.sendEmail(user.email,
            "Alerte SOS - Voisinage",
            `Une alerte SOS est active près de chez vous : ${a.user} à ${a.location}. Message: ${a.message}`);
        }
      }

      console.log(`[ESCALATION 3min] ${alertId} → ${nearby.length} voisins + ${contacts.length} contacts`);
    } else {
      console.log(`[ESCALATION 3min] ${alertId} résolue.`);
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
    console.log(`[ESCALATION CANCELLED] Timers ${alertId} annulés.`);
  }
}

const AlertController = {
  getAll(req, res) {
    res.json(AlertModel.getAll());
  },

  getById(req, res) {
    const alert = AlertModel.getById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alerte non trouvée" });
    const positions = AlertPositionModel.getByAlertId(req.params.id);
    res.json({ ...alert, positions });
  },

  create(req, res) {
    const { message, status } = req.body;
    const device = DeviceModel.get();
    const lat = device.latitude || 0;
    const lng = device.longitude || 0;
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: "Console Admin",
      location: `Abidjan (Simulé: ${lat}, ${lng})`,
      status: status || "URGENT",
      message: message || "Alerte manuelle depuis le tableau de bord",
      date: new Date().toISOString(),
      latitude: lat,
      longitude: lng
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
    const active = AlertModel.getActiveUrgentCount();
    if (active === 0) {
      DeviceModel.update({ status: "Connecté" });
    }
    console.log(`[RESOLVED] Alerte ${id} résolue.`);
    res.json({ success: true, alert: AlertModel.getById(id) });
  },

  getPositions(req, res) {
    const positions = AlertPositionModel.getByAlertId(req.params.id);
    res.json(positions);
  },

  exportDossier(req, res) {
    const alert = AlertModel.getById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: "Alerte non trouvée" });

    const positions = AlertPositionModel.getByAlertId(req.params.id);
    const user = alert.userId ? UserModel.findById(alert.userId) : null;
    const contacts = ContactModel.getAll();

    const dossier = {
      title: "Dossier d'alerte - SafeGuardian CI",
      generatedAt: new Date().toISOString(),
      alert: {
        id: alert.id,
        status: alert.status,
        message: alert.message,
        location: alert.location,
        coordinates: { lat: alert.latitude, lng: alert.longitude },
        declaredAt: alert.date,
        escalationLevel: alert.escalated ? 3 : 0,
        escalationStage: alert.escalationTime || ""
      },
      victim: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        deviceId: user.device_id
      } : { name: alert.user },
      emergencyContacts: contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        relation: c.relation
      })),
      positionHistory: positions.map(p => ({
        lat: p.latitude,
        lng: p.longitude,
        time: p.timestamp
      })),
      timeline: [
        { time: alert.date, event: "Alerte déclenchée" },
        ...(alert.message ? [{ time: alert.date, event: alert.message }] : []),
        ...(alert.escalationTime ? [{ time: alert.escalationTime, event: "Escalade déclenchée" }] : []),
        ...(alert.status === "RÉSOLU" ? [{ time: new Date().toISOString(), event: "Alerte résolue" }] : [])
      ]
    };

    res.json(dossier);
  }
};

module.exports = { AlertController, scheduleEscalation, cancelEscalation };