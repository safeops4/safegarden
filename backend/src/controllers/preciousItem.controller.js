const PreciousItemModel = require("../models/preciousItem.model");

function generateQrData(item) {
  return JSON.stringify({
    type: "precious_item",
    id: item.id,
    name: item.name,
    ownerId: item.user_id
  });
}

const PreciousItemController = {
  getAll(req, res) {
    const userId = req.user.id;
    res.json(PreciousItemModel.getAll(userId));
  },

  getById(req, res) {
    const item = PreciousItemModel.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Objet non trouvé" });
    res.json(item);
  },

  create(req, res) {
    const { name, description, photo } = req.body;
    const userId = req.user.id;
    const item = PreciousItemModel.create({
      id: "precious-" + Date.now(),
      name,
      description,
      photo,
      user_id: userId,
      date: new Date().toISOString()
    });
    const qrData = generateQrData(item);
    PreciousItemModel.update(item.id, { qr_data: qrData });
    res.json({ ...item, qr_data: qrData });
  },

  update(req, res) {
    const item = PreciousItemModel.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Objet non trouvé" });
    const updated = PreciousItemModel.update(req.params.id, req.body);
    res.json(updated);
  },

  remove(req, res) {
    const item = PreciousItemModel.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Objet non trouvé" });
    PreciousItemModel.remove(req.params.id);
    res.json({ success: true, message: "Objet supprimé" });
  }
};

module.exports = PreciousItemController;