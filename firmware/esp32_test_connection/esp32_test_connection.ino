/*
 * SafeGuardian CI - TEST DE CONNEXION
 * 
 * Téléverse ce sketch en premier pour vérifier
 * que l'ESP32 peut joindre le serveur.
 * Ouvre le Moniteur Série (115200 bauds).
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PWD  = "YOUR_WIFI_PASSWORD";
const char* SERVER    = "amused-passion-production.up.railway.app";

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== TEST DE CONNEXION SAFEGUARDIAN ===");
  Serial.printf("Serveur: %s\n\n", SERVER);

  // Étape 1 : WiFi
  Serial.print("[1/4] Connexion WiFi... ");
  WiFi.begin(WIFI_SSID, WIFI_PWD);
  int n = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++n > 40) {
      Serial.println(" ÉCHEC (vérifie SSID/MDP)");
      while(1);
    }
  }
  Serial.printf(" OK (%s)\n", WiFi.localIP().toString().c_str());

  // Étape 2 : DNS
  Serial.print("[2/4] Résolution DNS... ");
  IPAddress ip;
  if (WiFi.hostByName(SERVER, ip)) {
    Serial.printf("OK (%s)\n", ip.toString().c_str());
  } else {
    Serial.println("ÉCHEC (nom introuvable)");
    while(1);
  }

  // Étape 3 : TCP (port 443)
  Serial.print("[3/4] Connexion TCP (port 443)... ");
  WiFiClientSecure client;
  client.setInsecure();
  if (client.connect(SERVER, 443)) {
    Serial.println("OK");
  } else {
    Serial.printf("ÉCHEC (errno=%d)\n", errno);
    while(1);
  }

  // Étape 4 : HTTP POST
  Serial.print("[4/4] Envoi requête HTTP... ");
  HTTPClient http;
  http.begin(client, String("https://") + SERVER + "/api/esp32/heartbeat");
  http.addHeader("Content-Type", "application/json");

  int code = http.POST("{\"deviceId\":\"SG001\",\"battery\":100}");
  String response = http.getString();
  http.end();

  if (code == 200) {
    Serial.printf("OK (HTTP %d)\nRéponse: %s\n", code, response.c_str());
  } else {
    Serial.printf("ÉCHEC (HTTP %d)\nRéponse: %s\n", code, response.c_str());
    while(1);
  }

  Serial.println("\n✅ CONNEXION RÉUSSIE !");
  Serial.println("Tu peux maintenant utiliser le firmware principal.");
}

void loop() {}
