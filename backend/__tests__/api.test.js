const request = require("supertest");
const fs = require("fs");
const path = require("path");
const { app, init } = require("../server");

const TEST_DB = path.join(__dirname, "..", "test-data.db");
const UNIQUE_EMAIL = `test-${Date.now()}@test.ci`;
let token;

beforeAll(async () => {
  try { fs.unlinkSync(TEST_DB); } catch {}
  process.env.DB_PATH = TEST_DB;
  await init();
});

afterAll(() => {
  try { fs.unlinkSync(TEST_DB); } catch {}
});

describe("Auth Endpoints", () => {
  test("POST /api/register - validation errors", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: "bad", password: "12", name: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/register - success", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: UNIQUE_EMAIL, password: "test1234", name: "Test User" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test("POST /api/register - duplicate email", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: UNIQUE_EMAIL, password: "test1234", name: "Test User" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("déjà enregistré");
  });

  test("POST /api/login - success", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: UNIQUE_EMAIL, password: "test1234" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("POST /api/login - wrong password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: UNIQUE_EMAIL, password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("Protected Endpoints", () => {
  test("GET /api/device - without token", async () => {
    const res = await request(app).get("/api/device");
    expect(res.status).toBe(401);
  });

  test("GET /api/device - with token", async () => {
    const res = await request(app)
      .get("/api/device")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toMatch(/^SG\d{3}$/);
  });

  test("GET /api/alerts - with token", async () => {
    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/contacts - with token", async () => {
    const res = await request(app)
      .get("/api/contacts")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/lost-items - with token", async () => {
    const res = await request(app)
      .get("/api/lost-items")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/lost-documents - with token", async () => {
    const res = await request(app)
      .get("/api/lost-documents")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("ESP32 Endpoint", () => {
  test("POST /api/esp32/button-down + button-up + confirm-sos + legacy", async () => {
    const deviceId = "SG001";

    const downRes = await request(app)
      .post("/api/esp32/button-down")
      .send({ deviceId });
    expect(downRes.status).toBe(200);
    expect(downRes.body.success).toBe(true);
    expect(downRes.body.alertId).toBeDefined();

    const upRes = await request(app)
      .post("/api/esp32/button-up")
      .send({ deviceId });
    expect(upRes.status).toBe(200);
    expect(upRes.body.confirmed).toBe(false);

    const downRes2 = await request(app)
      .post("/api/esp32/button-down")
      .send({ deviceId });
    expect(downRes2.status).toBe(200);

    const confirmRes = await request(app)
      .post("/api/esp32/confirm-sos")
      .send({ deviceId });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);

    const legacyRes = await request(app)
      .post("/api/esp32/button")
      .send({ user: "Test Bracelet", message: "Test SOS" });
    expect(legacyRes.status).toBe(200);
    expect(legacyRes.body.success).toBe(true);

    const heartbeatRes = await request(app)
      .post("/api/esp32/heartbeat")
      .send({ deviceId, battery: 85 });
    expect(heartbeatRes.status).toBe(200);
    expect(heartbeatRes.body.success).toBe(true);
  });
});

describe("CRUD Endpoints", () => {
  test("POST /api/alerts - create alert", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Test alert from jest" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("PUT /api/alerts/:id/resolve - resolve alert", async () => {
    const alertsRes = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    const alertId = alertsRes.body[0]?.id;
    expect(alertId).toBeDefined();
    const res = await request(app)
      .put(`/api/alerts/${alertId}/resolve`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("POST /api/contacts - create contact", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Contact", phone: "+225 00000000", relation: "Famille" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("POST /api/lost-items - create lost item", async () => {
    const res = await request(app)
      .post("/api/lost-items")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Item", description: "A test item description" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("POST /api/lost-documents - create lost document", async () => {
    const res = await request(app)
      .post("/api/lost-documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "CNI", ownerName: "Test Person", number: "CI000000" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("PUT /api/device - update device", async () => {
    const res = await request(app)
      .put("/api/device")
      .set("Authorization", `Bearer ${token}`)
      .send({ battery: 50 });
    expect(res.status).toBe(200);
    expect(res.body.battery).toBe(50);
  });

  test("POST /api/found-items - create found item", async () => {
    const res = await request(app)
      .post("/api/found-items")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "iPhone trouvé", description: "iPhone 13 noir", location: "Commissariat Yopougon" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("iPhone trouvé");
  });

  test("GET /api/found-items - list found items", async () => {
    const res = await request(app)
      .get("/api/found-items")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("POST /api/found-documents - create found document with owner match", async () => {
    const res = await request(app)
      .post("/api/found-documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "CNI", ownerName: "Test User", number: "CI999999", location: "Mairie Cocody" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.owner_name).toBe("Test User");
    expect(res.body.ownerMatched).toBe(true);
  });

  test("GET /api/found-documents - list found documents", async () => {
    const res = await request(app)
      .get("/api/found-documents")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("POST /api/precious-items - CRUD", async () => {
    const createRes = await request(app)
      .post("/api/precious-items")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "MacBook Pro", description: "Apple M3 Max" });
    expect(createRes.status).toBe(200);
    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.qr_data).toBeDefined();

    const listRes = await request(app)
      .get("/api/precious-items")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);

    const delRes = await request(app)
      .delete(`/api/precious-items/${createRes.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(delRes.status).toBe(200);
  });

  test("POST /api/esp32/forced-removal - retrait forcé", async () => {
    const res = await request(app)
      .post("/api/esp32/forced-removal")
      .send({ deviceId: "SG001" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.alertId).toBeDefined();
  });

  test("POST /api/esp32/deactivate + activate", async () => {
    const deactRes = await request(app)
      .post("/api/esp32/deactivate")
      .send({ deviceId: "SG001", hours: 2 });
    expect(deactRes.status).toBe(200);
    expect(deactRes.body.success).toBe(true);
    expect(deactRes.body.deactivated_until).toBeDefined();

    const actRes = await request(app)
      .post("/api/esp32/activate")
      .send({ deviceId: "SG001" });
    expect(actRes.status).toBe(200);
    expect(actRes.body.success).toBe(true);
  });

  test("GET /api/found-items/public - sans auth", async () => {
    const res = await request(app).get("/api/found-items/public");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/found-documents/public - sans auth", async () => {
    const res = await request(app).get("/api/found-documents/public");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/alerts/:id/export - export dossier", async () => {
    const alertsRes = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    const alertId = alertsRes.body[0]?.id;
    expect(alertId).toBeDefined();
    const res = await request(app)
      .get(`/api/alerts/${alertId}/export`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.alert).toBeDefined();
    expect(res.body.victim).toBeDefined();
    expect(res.body.timeline).toBeDefined();
  });

  test("GET /api/alerts/:id - get alert with positions", async () => {
    const alertsRes = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    const alertId = alertsRes.body[0]?.id;
    expect(alertId).toBeDefined();
    const res = await request(app)
      .get(`/api/alerts/${alertId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.positions).toBeDefined();
  });

  test("POST /api/esp32/heartbeat - with position tracking", async () => {
    const res = await request(app)
      .post("/api/esp32/heartbeat")
      .send({ deviceId: "SG001", battery: 90, latitude: 5.35, longitude: -3.98 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
