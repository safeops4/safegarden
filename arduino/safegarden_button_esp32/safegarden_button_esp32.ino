#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "NOM_DU_WIFI";
const char* WIFI_PASSWORD = "MOT_DE_PASSE_WIFI";

// Remplacer 192.168.1.20 par l'adresse IP du PC qui lance le site.
const char* SERVER_URL = "http://172.20.10.3:4281/api/esp32-button";

const int BUTTON_PIN = 18;
const unsigned long DEBOUNCE_MS = 250;

const char* messages[] = {
  "Besoin d'aide, je suis ici.",
  "Alerte rapide envoyee depuis le boitier.",
  "Je veux prevenir mes contacts.",
  "Signal discret recu par le site.",
  "Controle de securite demande.",
  "Appui bouton ESP32 detecte."
};

const int messageCount = sizeof(messages) / sizeof(messages[0]);

int lastButtonState = HIGH;
unsigned long lastPressAt = 0;

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connecte. IP ESP32: ");
  Serial.println(WiFi.localIP());
}

void sendRandomMessage() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  const char* message = messages[random(messageCount)];
  String payload = "{\"message\":\"" + String(message) + "\"}";

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST(payload);
  Serial.print("Message envoye: ");
  Serial.println(message);
  Serial.print("Code HTTP: ");
  Serial.println(statusCode);

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  randomSeed(esp_random());
  connectWifi();
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  bool pressed = lastButtonState == HIGH && buttonState == LOW;

  if (pressed && millis() - lastPressAt > DEBOUNCE_MS) {
    lastPressAt = millis();
    sendRandomMessage();
  }

  lastButtonState = buttonState;
  delay(20);
}
