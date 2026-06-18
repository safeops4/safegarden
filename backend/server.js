const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { initDatabase } = require("./src/database");
const { migrateFromJson } = require("./src/migration");

const authRoutes = require("./src/routes/auth.routes");
const alertRoutes = require("./src/routes/alert.routes");
const esp32Routes = require("./src/routes/esp32.routes");
const lostItemRoutes = require("./src/routes/lostItem.routes");
const lostDocumentRoutes = require("./src/routes/lostDocument.routes");
const contactRoutes = require("./src/routes/contact.routes");
const deviceRoutes = require("./src/routes/device.routes");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));

app.use("/api", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/esp32", esp32Routes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/lost-documents", lostDocumentRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/device", deviceRoutes);

// Serve frontend static files in production
const staticDir = process.env.STATIC_DIR || path.join(__dirname, "..", "frontend", "dist");
if (process.env.SERVE_STATIC === "true" && fs.existsSync(staticDir)) {
  console.log(`[STATIC] Serving frontend from ${staticDir}`);
  app.use(express.static(staticDir));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(staticDir, "index.html"));
    }
  });
}

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Erreur interne du serveur" });
});

const PORT = process.env.PORT || 5000;

async function init() {
  await initDatabase();
  migrateFromJson();
}

function listen() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SafeGuardian API ON - Listening on port ${PORT}`);
  });
}

if (require.main === module) {
  init().then(listen);
}

module.exports = { app, init };
