const FoundDocumentModel = require("../models/foundDocument.model");
const UserModel = require("../models/user.model");
const NotificationService = require("../services/notification.service");

const FoundDocumentController = {
  getAll(req, res) {
    res.json(FoundDocumentModel.getAll());
  },

  async create(req, res) {
    const { type, ownerName, number, location } = req.body;

    const doc = FoundDocumentModel.create({
      id: "found-doc-" + Date.now(),
      type: type || "CNI",
      owner_name: ownerName,
      number: number || "",
      location: location || "",
      status: "En attente",
      date: new Date().toISOString(),
      declared_by: req.user ? req.user.name || req.user.email : "Anonyme",
      notified: false
    });

    const matchedUsers = UserModel.findByName(ownerName);
    if (matchedUsers.length > 0) {
      for (const user of matchedUsers) {
        const subject = "Votre document a été retrouvé - SafeGuardian";
        const message = `Bonjour ${user.name}, votre document (${doc.type}) a été retrouvé et déposé à ${location || "la commune"}. Réf: ${doc.id}. Veuillez vous présenter au commissariat le plus proche muni d'une pièce d'identité.`;
        if (user.phone) {
          await NotificationService.sendSMS(user.phone, message);
        }
        if (user.email) {
          await NotificationService.sendEmail(user.email, subject, message);
        }
        console.log(`[FOUND-DOC] Notification envoyée à ${user.name} (${user.email || user.phone}) pour le document ${doc.id}`);
      }
      FoundDocumentModel.markNotified(doc.id);
    }

    res.json({ ...doc, ownerMatched: matchedUsers.length > 0, matchedCount: matchedUsers.length });
  }
};

module.exports = FoundDocumentController;