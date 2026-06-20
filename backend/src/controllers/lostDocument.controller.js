const LostDocumentModel = require("../models/lostDocument.model");

function generateQrData(doc) {
  return JSON.stringify({
    type: "lost_document",
    id: doc.id,
    ownerName: doc.owner_name,
    userId: doc.user_id
  });
}

const LostDocumentController = {
  getAll(req, res) {
    res.json(LostDocumentModel.getAll());
  },

  create(req, res) {
    const { type, ownerName, number } = req.body;
    const userId = req.user ? req.user.id : 0;
    const doc = LostDocumentModel.create({
      id: "doc-" + Date.now(),
      type,
      ownerName,
      number,
      status: "En attente",
      date: new Date().toISOString(),
      user_id: userId
    });
    const qrData = generateQrData(doc);
    LostDocumentModel.update(doc.id, { qr_data: qrData });
    res.json({ ...doc, qr_data: qrData });
  }
};

module.exports = LostDocumentController;