const { Router } = require("express");
const AuthController = require("../controllers/auth.controller");
const { validate, required, isEmail, minLength, optional } = require("../middleware/validate.middleware");

const router = Router();

router.post(
  "/register",
  validate({
    email: [required, isEmail],
    password: [required, minLength(4)],
    name: [required]
  }),
  AuthController.register
);

router.post(
  "/login",
  validate({
    password: [required]
  }),
  AuthController.login
);

module.exports = router;
