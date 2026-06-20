const LostItemModel = require("../models/lostItem.model");

function generateQrData(item) {
  return JSON.stringify({
    type: "lost_item",
    id: item.id,
    name: item.name,
    userId: item.user_id
  });
}

const LostItemController = {
  getAll(req, res) {
    res.json(LostItemModel.getAll());
  },

  create(req, res) {
    const { name, description } = req.body;
    const userId = req.user ? req.user.id : 0;
    const item = LostItemModel.create({
      id: "item-" + Date.now(),
      name,
      description,
      status: "En recherche",
      date: new Date().toISOString(),
      user_id: userId
    });
    const qrData = generateQrData(item);
    LostItemModel.update(item.id, { qr_data: qrData });
    res.json({ ...item, qr_data: qrData });
  }
};

module.exports = LostItemController;