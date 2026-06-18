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
    expect(res.body.id).toBe("SG001");
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
  test("POST /api/esp32/button - creates alert", async () => {
    const res = await request(app)
      .post("/api/esp32/button")
      .send({ user: "Test Bracelet", message: "Test SOS" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
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
});
