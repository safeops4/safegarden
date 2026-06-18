#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURATION WI-FI ---
const char* ssid = "VOTRE_NOM_WIFI";
const char* password = "VOTRE_MOT_DE_PASSE_WIFI";

// --- CONFIGURATION SERVEUR API ---
// Remplacez par l'adresse IP de votre machine sur le réseau local (ex: http://192.168.1.15:5000/api/esp32-button)
const char* serverUrl = "http://192.168.x.x:5000/api/esp32/button"; 

// --- PINS ---
const int BUTTON_PIN = 18;  // Broche du bouton poussoir
const int LED_PIN = 2;      // LED embarquée pour indicateurs visuels

// --- PARAMÈTRES DE TEMPS ---
const unsigned long HOLD_TIME = 5000; // Durée de maintien requise en millisecondes (5 secondes)
unsigned long pressStartTime = 0;
bool isPressing = false;
bool sosTriggered = false;

void setup() {
  Serial.begin(115200);
  
  // Configuration des broches
  // Utilisation de INPUT_PULLUP : le bouton doit relier le pin 18 à la masse (GND) lors de l'appui
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  
  digitalWrite(LED_PIN, LOW);

  // Connexion Wi-Fi
  connectToWiFi();
}

void loop() {
  // En INPUT_PULLUP, HIGH = relâché, LOW = appuyé
  int buttonState = digitalRead(BUTTON_PIN);
  
  if (buttonState == LOW) {
    if (!isPressing) {
      // Le bouton vient d'être appuyé
      isPressing = true;
      pressStartTime = millis();
      Serial.println("Bouton appuyé. Maintien requis : 5 secondes...");
      
      // Petit indicateur visuel (LED s'allume faiblement ou commence à clignoter)
      digitalWrite(LED_PIN, HIGH); 
    } else {
      // Le bouton est toujours maintenu
      unsigned long elapsed = millis() - pressStartTime;
      
      // Faire clignoter la LED de plus en plus vite à mesure qu'on approche des 5 secondes
      if (elapsed < HOLD_TIME) {
        int blinkInterval = map(elapsed, 0, HOLD_TIME, 500, 50);
        digitalWrite(LED_PIN, (millis() / blinkInterval) % 2 == 0 ? HIGH : LOW);
      }
      
      // Si maintenu pendant plus de 5 secondes et que le SOS n'a pas encore été envoyé
      if (elapsed >= HOLD_TIME && !sosTriggered) {
        Serial.println("SOS DÉCLENCHÉ ! Envoi du signal au serveur...");
        triggerSOSAlert();
        sosTriggered = true;
        
        // LED reste allumée en continu pour indiquer le SOS déclenché
        digitalWrite(LED_PIN, HIGH);
      }
    }
  } else {
    // Le bouton a été relâché
    if (isPressing) {
      isPressing = false;
      sosTriggered = false;
      digitalWrite(LED_PIN, LOW); // Éteindre la LED
      Serial.println("Bouton relâché. SOS annulé/réinitialisé.");
    }
  }
  
  delay(50); // Petit délai anti-rebond (debounce)
}

void connectToWiFi() {
  Serial.print("Connexion au Wi-Fi ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  // Clignotement lent pendant la recherche Wi-Fi
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH);
    delay(250);
    digitalWrite(LED_PIN, LOW);
    delay(250);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("Wi-Fi connecté !");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());
  
  // Clignote 3 fois rapidement pour confirmer la connexion
  for(int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void triggerSOSAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Construction du corps JSON
    // Vous pouvez insérer des coordonnées GPS simulées ou réelles ici
    String jsonPayload = "{\"user\":\"Bracelet ESP32-SG18\",\"message\":\"SOS CRITIQUE : Bouton physique maintenu pendant 5 secondes sur GPIO 18 !\",\"location\":\"Abidjan, Cocody (GPIO 18)\"}";
    
    Serial.println("Envoi du payload : " + jsonPayload);
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Code réponse HTTP : ");
      Serial.println(httpResponseCode);
      Serial.println("Réponse du serveur : " + response);
      
      // Clignotement très rapide de succès
      for(int i = 0; i < 10; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(50);
        digitalWrite(LED_PIN, LOW);
        delay(50);
      }
    } else {
      Serial.print("Erreur lors de la requête POST : ");
      Serial.println(httpResponseCode);
      // Double flash lent d'erreur
      for(int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(1000);
        digitalWrite(LED_PIN, LOW);
        delay(1000);
      }
    }
    
    http.end();
  } else {
    Serial.println("Erreur : Wi-Fi déconnecté. Impossible d'envoyer l'alerte.");
    connectToWiFi(); // Tenter de se reconnecter
  }
}
