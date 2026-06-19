/*
 * SafeGuardian CI - Firmware ESP32
 * Bracelet connecté avec bouton SOS + LED
 * 
 * Matériel :
 *   - ESP32 (WROOM, etc.)
 *   - 1x Bouton poussoir (GPIO 13 → GND)
 *   - 1x LED (GPIO 12 → GND avec résistance 220Ω)
 *   - Alimentation : batterie LiPo + chargeur TP4056
 * 
 * Connexion :
 *   - WiFi → Internet → SafeGuardian API
 *   - Bouton maintenu 3s → Alerte SOS
 *   - LED clignote 3x/secondes pendant le countdown
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// === CONFIGURATION ===
const char* WIFI_SSID = "Votre_WiFi";
const char* WIFI_PWD  = "Votre_MotDePasse";

const char* SERVER_URL = "https://amused-passion-production.up.railway.app";
const char* DEVICE_ID  = "SG001";

// Pins
const int BTN_PIN = 13;
const int LED_PIN = 12;
const int BATTERY_PIN = 34;   // Entrée analogique pour mesure batterie (diviseur de tension)

// Timing
const unsigned long HEARTBEAT_INTERVAL = 30000;  // 30s
const unsigned long SOS_HOLD_MS = 3000;           // 3s
const unsigned long LED_BLINK_MS = 150;           // clignotement rapide

// === ÉTATS ===
enum State {
  IDLE,
  COUNTDOWN,
  SOS_CONFIRMED
};

State currentState = IDLE;
unsigned long btnPressTime = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastLedToggle = 0;
bool ledState = false;
bool lastBtnState = HIGH;
bool sosSent = false;

// === WiFi ===
void connectWiFi() {
  Serial.print("[WiFi] Connexion à ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PWD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connecté ! IP: " + WiFi.localIP().toString());
}

float readBattery() {
  int raw = analogRead(BATTERY_PIN);
  float voltage = raw * 3.3 / 4095.0;
  float batteryPercent = constrain(map(voltage * 100, 330, 420, 0, 100), 0, 100);
  return batteryPercent;
}

// === API HTTP ===
bool apiPost(const char* path, const char* body) {
  WiFiClientSecure client;
  client.setInsecure();  // Accepte tous les certificats SSL

  HTTPClient http;
  String url = String(SERVER_URL) + path;

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(body);

  if (code == 200 || code == 201) {
    Serial.printf("[API] %s → %d OK\n", path, code);
    http.end();
    return true;
  }

  Serial.printf("[API] %s → %d ERREUR\n", path, code);
  http.end();
  return false;
}

void sendHeartbeat() {
  char body[64];
  snprintf(body, sizeof(body),
    "{\"deviceId\":\"%s\",\"battery\":%.0f}",
    DEVICE_ID, readBattery());
  apiPost("/api/esp32/heartbeat", body);
}

void sendButtonDown() {
  char body[64];
  snprintf(body, sizeof(body), "{\"deviceId\":\"%s\"}", DEVICE_ID);
  apiPost("/api/esp32/button-down", body);
}

void sendButtonUp() {
  char body[64];
  snprintf(body, sizeof(body), "{\"deviceId\":\"%s\"}", DEVICE_ID);
  apiPost("/api/esp32/button-up", body);
}

void sendConfirmSos() {
  char body[64];
  snprintf(body, sizeof(body), "{\"deviceId\":\"%s\"}", DEVICE_ID);
  apiPost("/api/esp32/confirm-sos", body);
}

// === LED ===
void setLed(bool on) {
  digitalWrite(LED_PIN, on ? HIGH : LOW);
}

void blinkLed() {
  unsigned long now = millis();
  if (now - lastLedToggle >= LED_BLINK_MS) {
    ledState = !ledState;
    setLed(ledState);
    lastLedToggle = now;
  }
}

void sosLed() {
  setLed(HIGH);
}

void ledOff() {
  setLed(LOW);
  ledState = false;
}

// === SETUP ===
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== SafeGuardian CI - ESP32 ===");

  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  ledOff();

  // Initialisation batterie (lecture analogique)
  pinMode(BATTERY_PIN, INPUT);
  analogReadResolution(12);

  connectWiFi();

  // Premier heartbeat
  sendHeartbeat();
  lastHeartbeat = millis();
}

// === LOOP ===
void loop() {
  unsigned long now = millis();
  bool btnState = digitalRead(BTN_PIN);

  switch (currentState) {
    case IDLE: {
      if (btnState == LOW && lastBtnState == HIGH) {
        // Bouton vient d'être enfoncé
        Serial.println("[BTN] Enfoncé → Début countdown 3s");
        btnPressTime = now;
        currentState = COUNTDOWN;
        sendButtonDown();
        sosSent = false;
      }

      // Heartbeat périodique
      if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        sendHeartbeat();
        lastHeartbeat = now;
      }
      break;
    }

    case COUNTDOWN: {
      if (btnState == HIGH) {
        // Bouton relâché avant 3s → Annulation
        unsigned long elapsed = now - btnPressTime;
        Serial.printf("[BTN] Relâché après %lums → Annulation\n", elapsed);
        sendButtonUp();
        ledOff();
        currentState = IDLE;
        break;
      }

      // LED clignote rapidement
      blinkLed();

      // Vérifie si 3s sont passées
      if (now - btnPressTime >= SOS_HOLD_MS && !sosSent) {
        Serial.println("[SOS] 3s atteintes → CONFIRMATION SOS !");
        sendConfirmSos();
        sosSent = true;
        currentState = SOS_CONFIRMED;
        ledOff();
      }
      break;
    }

    case SOS_CONFIRMED: {
      // LED allumée fixe (SOS actif)
      sosLed();

      // Si bouton relâché après confirmation
      if (btnState == HIGH && lastBtnState == LOW) {
        Serial.println("[SOS] Bouton relâché (alerte déjà confirmée)");
        sendButtonUp();
      }

      // Heartbeat pendant SOS
      if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        sendHeartbeat();
        lastHeartbeat = now;
      }
      break;
    }
  }

  lastBtnState = btnState;
  delay(10);  // Petite pause pour stabilité
}
