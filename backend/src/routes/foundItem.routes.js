const { Router } = require("express");
const FoundItemController = require("../controllers/foundItem.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", FoundItemController.getAll);
router.get("/public", FoundItemController.getAll);
router.post("/", verifyToken, FoundItemController.create);

module.exports = router;