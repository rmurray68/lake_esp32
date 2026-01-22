#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include "time.h" // Built-in ESP32 time library

// MQTT Topics
#define AWS_IOT_PUBLISH_TOPIC   "lakehouse/monitor/status"
#define AWS_IOT_SUBSCRIBE_TOPIC "lakehouse/monitor/command"

// NTP Settings for Epoch Time
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;      // Keep at 0 for UTC (best for DB timestamps)
const int   daylightOffset_sec = 0;

// Configuration
const int PING_INTERVAL = 60000; // Ping every 60 seconds
unsigned long lastMillis = 0;

WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);

// MQTT message callback
void messageCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  const char* command = doc["command"];
  Serial.print("Command received: ");
  Serial.println(command);
  
  if (strcmp(command, "reboot") == 0) {
    Serial.println("Rebooting ESP32...");
    delay(1000);
    ESP.restart();
  } else if (strcmp(command, "health_check") == 0) {
    Serial.println("Health check - publishing status immediately");
    bool isUp = checkURL("http://www.google.com");
    publishMessage(isUp);
  }
}

void connectAWS() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // Configure NTP Time (Required for ExpirationTime)
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("NTP Time Synced");

  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(messageCallback);

  Serial.println("Connecting to AWS IoT");
  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }

  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }
  Serial.println("AWS IoT Connected!");
  
  // Subscribe to command topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);
  Serial.print("Subscribed to: ");
  Serial.println(AWS_IOT_SUBSCRIBE_TOPIC);
}

bool checkURL(const char* url) {
  HTTPClient http;
  http.setTimeout(5000);
  http.begin(url); 
  int httpCode = http.GET();
  
  bool success = (httpCode > 0);
  http.end();
  return success;
}

unsigned long getEpochTime() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return(0);
  }
  time(&now);
  return now;
}

void publishMessage(bool internetStatus) {
  unsigned long now = getEpochTime();
  // 90 days in seconds = 90 * 24 * 60 * 60
  unsigned long expireAt = now + 7776000; 

  StaticJsonDocument<256> doc;
  doc["device"] = THINGNAME;
  doc["internet_ok"] = internetStatus;
  doc["signal_strength"] = WiFi.RSSI();
  doc["uptime_sec"] = millis() / 1000;
  
  // Only add ExpirationTime if we have a valid timestamp from NTP
  if (now > 0) {
    doc["ExpirationTime"] = expireAt;
  }

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
  Serial.println("Published to AWS: " + String(jsonBuffer));
}

void setup() {
  Serial.begin(115200);
  connectAWS();
}

void loop() {
  if (!client.connected()) {
    connectAWS();
  }
  client.loop();

  if (millis() - lastMillis > PING_INTERVAL) {
    lastMillis = millis();
    bool isUp = checkURL("http://www.google.com");
    publishMessage(isUp);
  }
}