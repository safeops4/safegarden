const { Router } = require("express");
const Esp32Controller = require("../controllers/esp32.controller");

const router = Router();

router.post("/heartbeat", Esp32Controller.heartbeat);
router.post("/button-down", Esp32Controller.buttonDown);
router.post("/button-up", Esp32Controller.buttonUp);
router.post("/confirm-sos", Esp32Controller.confirmSos);
router.post("/button", Esp32Controller.legacyAlert);
router.post("/forced-removal", Esp32Controller.forcedRemoval);
router.post("/deactivate", Esp32Controller.deactivate);
router.post("/activate", Esp32Controller.activate);

module.exports = router;