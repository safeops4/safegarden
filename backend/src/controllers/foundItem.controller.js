const FoundItemModel = require("../models/foundItem.model");

const FoundItemController = {
  getAll(req, res) {
    res.json(FoundItemModel.getAll());
  },

  create(req, res) {
    const { name, description, location } = req.body;
    const item = FoundItemModel.create({
      id: "found-item-" + Date.now(),
      name,
      description,
      location,
      status: "En attente",
      date: new Date().toISOString(),
      declared_by: req.user ? req.user.name || req.user.email : "Anonyme"
    });
    res.json(item);
  }
};

module.exports = FoundItemController;