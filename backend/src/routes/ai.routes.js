const { Router } = require("express");
const AIController = require("../controllers/ai.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.post("/match-item", verifyToken, AIController.matchItem);
router.post("/match-document", verifyToken, AIController.matchDocument);
router.get("/match-found-item/:id", verifyToken, AIController.matchFoundItem);
router.get("/match-found-document/:id", verifyToken, AIController.matchFoundDocument);
router.get("/search", AIController.search);
router.get("/anomalies", verifyToken, AIController.anomalies);
router.post("/chat", AIController.chat);

module.exports = router;