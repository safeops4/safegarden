const { Router } = require("express");
const { AlertController } = require("../controllers/alert.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, AlertController.getAll);
router.post("/", verifyToken, AlertController.create);
router.put("/:id/resolve", verifyToken, AlertController.resolve);

module.exports = router;
