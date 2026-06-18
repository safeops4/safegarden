const AlertModel = require("../models/alert.model");
const DeviceModel = require("../models/device.model");
const { scheduleEscalation } = require("./alert.controller");

const Esp32Controller = {
  receiveAlert(req, res) {
    const device = DeviceModel.get();
    const alert = AlertModel.create({
      id: "alert-" + Date.now(),
      user: req.body.user || "Bracelet SG001",
      location: req.body.location || `Abidjan (Simulé: ${device.latitude}, ${device.longitude})`,
      status: "URGENT",
      message: req.body.message || "Signal discret reçu (Bouton d'urgence)",
      date: new Date().toISOString()
    });

    DeviceModel.update({ status: "ALERTE SOS" });

    console.log("ESP32 Alert Received:", alert);

    scheduleEscalation(alert.id);

    res.json({
      success: true,
      message: "Signal discret reçu, compte à rebours d'escalade démarré"
    });
  }
};

module.exports = Esp32Controller;
