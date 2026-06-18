const LostDocumentModel = require("../models/lostDocument.model");

const LostDocumentController = {
  getAll(req, res) {
    res.json(LostDocumentModel.getAll());
  },

  create(req, res) {
    const { type, ownerName, number } = req.body;
    const doc = LostDocumentModel.create({
      id: "doc-" + Date.now(),
      type,
      ownerName,
      number,
      status: "En attente",
      date: new Date().toISOString()
    });
    res.json(doc);
  }
};

module.exports = LostDocumentController;
