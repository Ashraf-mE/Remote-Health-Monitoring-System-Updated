#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <Arduino_JSON.h>

const char* ssid = "shjl";
const char* password = "Ashraf123";

// WebSocket server address and port
const char* serverAddress = "192.168.188.77";
const uint16_t serverPort = 3005;             
const char* serverPath = "/mcuData";      
const char* email = "mrcools942@gmail.com";

WebSocketsClient webSocket;

// Timer variables
unsigned long lastTime = 0;
unsigned long timerDelay = 3000;

// Function to simulate data generation for bpm and ECG values
float getBPM() {
  return random(60, 100); // Simulated random bpm value
}

float getECG() {
  return random(0, 101); // Simulated ECG channel value
}

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());

  // WebSocket setup
  webSocket.begin(serverAddress, serverPort, serverPath);
  webSocket.onEvent(webSocketEvent); // Attach callback
  webSocket.setReconnectInterval(5000); // Retry every 5 seconds if connection fails

  Serial.println("WebSocket initialized, sending data every 5 seconds.");
}

void loop() {
  webSocket.loop(); // Keep the WebSocket connection alive

  if ((millis() - lastTime) > timerDelay) {
    // Default values for bpm and ECG
    float bpm = 0;
    float ecg1 = 0;
    float ecg2 = 0;
    float ecg3 = 0;

    // Assume some conditions here to check whether the equipment is in use
    bool bpmInUse = true;  // bpm equipment status
    bool ecgInUse = true;  // ECG equipment status

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
    jsonObject["email"] = email;
    jsonObject["bpm"] = bpm;
    JSONVar ecgObject; // Nested JSON object for ECG channels
    ecgObject["ecg1"] = ecg1;
    ecgObject["ecg2"] = ecg2;
    ecgObject["ecg3"] = ecg3;
    jsonObject["ecg"] = ecgObject; // Add ECG data to main JSON

    String jsonString = JSON.stringify(jsonObject);

    // Send JSON data via WebSocket
    webSocket.sendTXT(jsonString);

    // Print values for debugging
    Serial.print("BPM: ");
    Serial.println(bpm);
    Serial.print("Email: ");
    Serial.println(email);
    Serial.print("ECG1: ");
    Serial.println(ecg1);
    Serial.print("ECG2: ");
    Serial.println(ecg2);
    Serial.print("ECG3: ");
    Serial.println(ecg3);

    lastTime = millis(); // Update last time
  }
}

// WebSocket event handler
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected");
      break;
    case WStype_TEXT:
      Serial.printf("Message from server: %s\n", payload);
      break;
    case WStype_BIN:
      Serial.println("Received binary message");
      break;
  }
}
