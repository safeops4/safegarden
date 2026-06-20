const { Router } = require("express");
const FoundDocumentController = require("../controllers/foundDocument.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", FoundDocumentController.getAll);
router.get("/public", FoundDocumentController.getAll);
router.post("/", verifyToken, FoundDocumentController.create);

module.exports = router;