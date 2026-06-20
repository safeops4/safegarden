const DeviceModel = require("../models/device.model");
const UserModel = require("../models/user.model");

const DeviceController = {
  get(req, res) {
    if (req.user && req.user.id) {
      const user = UserModel.findById(req.user.id);
      if (user && user.device_id) {
        const device = DeviceModel.get(user.device_id);
        if (device) {
          const now = new Date();
          const deactivatedUntil = device.deactivatedUntil ? new Date(device.deactivatedUntil) : null;
          if (deactivatedUntil && deactivatedUntil <= now) {
            DeviceModel.update({ status: "Connecté", deactivated_until: "" }, user.device_id);
            device.status = "Connecté";
            device.deactivatedUntil = "";
          }
          return res.json(device);
        }
      }
    }
    res.json(DeviceModel.get());
  },

  update(req, res) {
    if (req.user && req.user.id) {
      const user = UserModel.findById(req.user.id);
      if (user && user.device_id) {
        const device = DeviceModel.update(req.body, user.device_id);
        if (device) return res.json(device);
      }
    }
    const device = DeviceModel.update(req.body);
    res.json(device);
  }
};

module.exports = DeviceController;