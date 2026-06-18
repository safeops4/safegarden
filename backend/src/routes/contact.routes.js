const { Router } = require("express");
const ContactController = require("../controllers/contact.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", verifyToken, ContactController.getAll);
router.post("/", verifyToken, ContactController.create);
router.delete("/:id", verifyToken, ContactController.remove);

module.exports = router;
