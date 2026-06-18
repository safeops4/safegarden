const { Router } = require("express");
const Esp32Controller = require("../controllers/esp32.controller");

const router = Router();

router.post("/button", Esp32Controller.receiveAlert);

module.exports = router;
