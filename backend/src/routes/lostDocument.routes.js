const { Router } = require("express");
const LostDocumentController = require("../controllers/lostDocument.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, LostDocumentController.getAll);
router.post("/", verifyToken, LostDocumentController.create);

module.exports = router;
