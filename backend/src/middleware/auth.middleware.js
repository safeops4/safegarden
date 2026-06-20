const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "safeguardian-dev-secret-change-in-production";

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, phone: user.phone || "" }, JWT_SECRET, { expiresIn: "24h" });
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token invalide ou expiré" });
  }
}

module.exports = { generateToken, verifyToken, JWT_SECRET };
