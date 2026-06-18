const { Router } = require("express");
const DeviceController = require("../controllers/device.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, DeviceController.get);
router.put("/", verifyToken, DeviceController.update);

module.exports = router;
