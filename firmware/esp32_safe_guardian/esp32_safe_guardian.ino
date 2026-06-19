/*
 * SafeGuardian CI - Firmware ESP32
 * Bracelet connecté avec bouton SOS + LED
 * 
 * GPIO 13 → Bouton (Pullup interne, ferme vers GND)
 * GPIO 12 → LED (anode → 220Ω → GND)
 * GPIO 34 → Batterie (diviseur de tension)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ========== CONFIGURATION UTILISATEUR ==========
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PWD  = "YOUR_WIFI_PASSWORD";
const char* SERVER    = "amused-passion-production.up.railway.app";
const char* DEVICE_ID = "SG001";
// ===============================================

// Pins
const int BTN_PIN = 13;
const int LED_PIN = 12;
const int BAT_PIN = 34;

const unsigned long HOLD_MS = 3000;
const unsigned long HEARTBEAT_MS = 30000;
const unsigned long BLINK_MS = 150;

enum State { IDLE, COUNTDOWN, SOS };
State state = IDLE;

unsigned long btnTime = 0, lastBeat = 0, lastBlink = 0;
bool ledOn = false, sosSent = false, lastBtn = HIGH;

// ========== WIFI ==========
bool connectWiFi() {
  Serial.printf("\n[WIFI] Connexion à \"%s\" ...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PWD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++attempts > 40) { // 20 second timeout
      Serial.println("\n[WIFI] ÉCHEC : pas de connexion après 20s");
      Serial.println("[WIFI] Vérifie SSID et mot de passe !");
      return false;
    }
  }
  Serial.printf("\n[WIFI] OK ! IP: %s\n", WiFi.localIP().toString().c_str());
  return true;
}

// ========== BATTERIE ==========
float readBattery() {
  int raw = analogRead(BAT_PIN);
  float v = raw * 3.3 / 4095.0;
  return constrain(map(v * 100, 330, 420, 0, 100), 0, 100);
}

// ========== API HTTPS ==========
bool apiPost(const char* path, const char* body) {
  Serial.printf("[HTTPS] POST %s%s\n  Body: %s\n", SERVER, path, body);

  WiFiClientSecure client;
  client.setInsecure();  // Accepte tous les certificats SSL

  HTTPClient http;
  if (!http.begin(client, String("https://") + SERVER + path)) {
    Serial.println("[HTTPS] ÉCHEC http.begin()");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);

  int code = http.POST(body);
  String response = http.getString();
  http.end();

  Serial.printf("[HTTPS] Code: %d\n[HTTPS] Réponse: %s\n", code, response.c_str());

  if (code > 0) return true;

  Serial.printf("[HTTPS] ÉCHEC (code=%d). Causes possibles :\n", code);
  Serial.println("  1. ESP32 ne résout pas le DNS (vérifie la connexion WiFi)");
  Serial.println("  2. Le port 443 est bloqué par le réseau/firewall");
  Serial.println("  3. Le certificat SSL est refusé");
  return false;
}

void sendHeartbeat() {
  char body[80];
  snprintf(body, sizeof(body), "{\"deviceId\":\"%s\",\"battery\":%.0f}", DEVICE_ID, readBattery());
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

// ========== LED ==========
void setLed(bool on) { digitalWrite(LED_PIN, on ? HIGH : LOW); }
void blinkFast() {
  unsigned long now = millis();
  if (now - lastBlink >= BLINK_MS) { ledOn = !ledOn; setLed(ledOn); lastBlink = now; }
}
void ledOff() { setLed(LOW); ledOn = false; }

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== SafeGuardian CI - ESP32 ===");
  Serial.printf("Device ID: %s\nServeur: %s\n\n", DEVICE_ID, SERVER);

  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BAT_PIN, INPUT);
  analogReadResolution(12);

  ledOff();

  // Test de connexion WiFi
  if (!connectWiFi()) {
    Serial.println("\n=== REBOOT dans 10s ===");
    delay(10000);
    ESP.restart();
    return;
  }

  // Test heartbeat au démarrage
  Serial.println("\n--- Test API heartbeat ---");
  sendHeartbeat();
  lastBeat = millis();

  Serial.println("\n=== Prêt. Appuie sur le bouton GPIO 13 pour tester ===");
}

// ========== LOOP ==========
void loop() {
  unsigned long now = millis();
  bool btn = digitalRead(BTN_PIN);

  switch (state) {
    case IDLE:
      if (btn == LOW && lastBtn == HIGH) {
        Serial.println("\n>>> Bouton ENFONCÉ - Attends 3s pour SOS...");
        btnTime = now;
        state = COUNTDOWN;
        sendButtonDown();
        sosSent = false;
      }
      if (now - lastBeat >= HEARTBEAT_MS) {
        sendHeartbeat();
        lastBeat = now;
      }
      break;

    case COUNTDOWN:
      blinkFast();
      if (btn == HIGH) {
        Serial.printf(">>> Bouton RELÂCHÉ après %lums - Alerte annulée\n", now - btnTime);
        sendButtonUp();
        ledOff();
        state = IDLE;
        break;
      }
      if (now - btnTime >= HOLD_MS && !sosSent) {
        Serial.println("\n*** 3s atteinte - SOS CONFIRMÉ ! ***");
        sendConfirmSos();
        sosSent = true;
        state = SOS;
      }
      break;

    case SOS:
      setLed(HIGH);
      if (now - lastBeat >= HEARTBEAT_MS) {
        sendHeartbeat();
        lastBeat = now;
      }
      break;
  }

  lastBtn = btn;
  delay(10);
}
