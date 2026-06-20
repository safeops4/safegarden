const UserModel = require("../models/user.model");
const { generateToken } = require("../middleware/auth.middleware");

const AuthController = {
  register(req, res) {
    const { email, password, name, phone, city } = req.body;
    if (email) {
      const exists = UserModel.findByEmail(email);
      if (exists) {
        return res.status(400).json({ success: false, message: "Cet email est déjà enregistré." });
      }
    }
    if (phone) {
      const exists = UserModel.findByPhone(phone);
      if (exists) {
        return res.status(400).json({ success: false, message: "Ce numéro de téléphone est déjà utilisé." });
      }
    }
    const user = UserModel.create(email, password, name, phone, city);
    const token = generateToken(user);
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, deviceId: user.device_id, phone: user.phone }, token, message: "Inscription réussie." });
  },

  login(req, res) {
    const { email, phone, password } = req.body;
    const identifier = email || phone;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email ou téléphone requis." });
    }
    let user = UserModel.findByEmail(identifier);
    if (!user) user = UserModel.findByPhone(identifier);
    if (!user || !UserModel.verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: "Email/Téléphone ou mot de passe incorrect." });
    }
    const token = generateToken(user);
    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, deviceId: user.device_id, phone: user.phone },
      token,
      message: "Connexion réussie"
    });
  }
};

module.exports = AuthController;
