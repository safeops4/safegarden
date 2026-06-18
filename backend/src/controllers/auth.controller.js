const UserModel = require("../models/user.model");
const { generateToken } = require("../middleware/auth.middleware");

const AuthController = {
  register(req, res) {
    const { email, password, name } = req.body;
    const exists = UserModel.findByEmail(email);
    if (exists) {
      return res.status(400).json({ success: false, message: "Cet email est déjà enregistré." });
    }
    const user = UserModel.create(email, password, name);
    const token = generateToken(user);
    res.json({ success: true, user, token, message: "Inscription réussie." });
  },

  login(req, res) {
    const { email, password } = req.body;
    const user = UserModel.findByEmail(email);
    if (!user || !UserModel.verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect." });
    }
    const token = generateToken(user);
    res.json({
      success: true,
      user: { email: user.email, name: user.name },
      token,
      message: "Connexion réussie"
    });
  }
};

module.exports = AuthController;
