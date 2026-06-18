const DeviceModel = require("../models/device.model");

const DeviceController = {
  get(req, res) {
    res.json(DeviceModel.get());
  },

  update(req, res) {
    const device = DeviceModel.update(req.body);
    res.json(device);
  }
};

module.exports = DeviceController;
