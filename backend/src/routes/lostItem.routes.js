const { Router } = require("express");
const LostItemController = require("../controllers/lostItem.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, LostItemController.getAll);
router.post("/", verifyToken, LostItemController.create);

module.exports = router;
