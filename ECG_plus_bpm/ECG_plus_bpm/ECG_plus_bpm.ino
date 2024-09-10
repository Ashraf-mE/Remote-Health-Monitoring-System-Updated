#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Arduino_JSON.h>

const char* ssid = "shjl";
const char* password = "Ashraf123";

// Your Domain name with URL path or IP address with path
const char* serverName = "http://192.168.188.77:3005/mcuData";

// Timer variables
unsigned long lastTime = 0;
unsigned long timerDelay = 1000;

// Function to simulate data generation for bpm and ECG values
float getBPM() {
  return random(60, 100); // Simulated random bpm value
}

float getECG() {
  return random(0, 101); // Simulated ECG channel value
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Timer set to 5 seconds (timerDelay variable), it will take 5 seconds before publishing the first reading.");
}

void loop() {
  if ((millis() - lastTime) > timerDelay) {
    if (WiFi.status() == WL_CONNECTED) {
      // Default values for bpm and ECG
      float bpm = 0;
      float ecg1 = 0;
      float ecg2 = 0;
      float ecg3 = 0;

      // Assume some conditions here to check whether the equipment is in use
      bool bpmInUse = true;      // bpm equipment status
      bool ecgInUse = true;      // ECG equipment status

      // If bpm equipment is in use, update bpm value
      if (bpmInUse) {
        bpm = getBPM();
      }

      // If ECG equipment is in use, update ECG values
      if (ecgInUse) {
        ecg1 = getECG();
        ecg2 = getECG();
        ecg3 = getECG();
      }

      // Create a JSON object to send bpm and ECG values
      JSONVar jsonObject;
      jsonObject["bpm"] = bpm;
      JSONVar ecgObject; // Nested JSON object for ECG channels
      ecgObject["ecg1"] = ecg1;
      ecgObject["ecg2"] = ecg2;
      ecgObject["ecg3"] = ecg3;
      jsonObject["ecg"] = ecgObject; // Add ECG data to main JSON

      String jsonString = JSON.stringify(jsonObject);

      // Send HTTP POST request
      int httpResponseCode = httpPOSTRequest(serverName, jsonString);

      // Print values
      Serial.print("BPM: ");
      Serial.println(bpm);
      Serial.print("ECG1: ");
      Serial.println(ecg1);
      Serial.print("ECG2: ");
      Serial.println(ecg2);
      Serial.print("ECG3: ");
      Serial.println(ecg3);

      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}

int httpPOSTRequest(const char* serverName, String jsonString) {
  WiFiClient client;
  HTTPClient http;

  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonString);

  http.end();
  return httpResponseCode;
}
