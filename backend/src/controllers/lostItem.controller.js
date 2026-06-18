const LostItemModel = require("../models/lostItem.model");

const LostItemController = {
  getAll(req, res) {
    res.json(LostItemModel.getAll());
  },

  create(req, res) {
    const { name, description } = req.body;
    const item = LostItemModel.create({
      id: "item-" + Date.now(),
      name,
      description,
      status: "En recherche",
      date: new Date().toISOString()
    });
    res.json(item);
  }
};

module.exports = LostItemController;
