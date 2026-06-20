const { Router } = require("express");
const PreciousItemController = require("../controllers/preciousItem.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, PreciousItemController.getAll);
router.get("/:id", verifyToken, PreciousItemController.getById);
router.post("/", verifyToken, PreciousItemController.create);
router.put("/:id", verifyToken, PreciousItemController.update);
router.delete("/:id", verifyToken, PreciousItemController.remove);

module.exports = router;