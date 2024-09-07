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
      // Generate a random value between 0 and 100
      float randomValue = random(0, 101);

      // Create a JSON object to send only one value
      JSONVar jsonObject;
      jsonObject["randomValue"] = randomValue;

      String jsonString = JSON.stringify(jsonObject);

      // Send HTTP POST request
      int httpResponseCode = httpPOSTRequest(serverName, jsonString);
      
      Serial.print("Random value: ");
      Serial.println(randomValue);

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
