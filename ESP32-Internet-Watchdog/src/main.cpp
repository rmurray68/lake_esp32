#include <Arduino.h> // <--- REQUIRED for VS Code / PlatformIO
#include <WiFi.h>
#include <ESP32Ping.h>
#include "secrets.h"

// --- CONFIGURATION ---
const char* ssid     = SECRET_SSID; // <--- Use the secret
const char* password = SECRET_PASS; // <--- Use the secret

const int RELAY_ROUTER = 17; // Connected to IN1
const int RELAY_MESH   = 27; // Connected to IN2

const int PING_INTERVAL_MINS = 5;    // Check every 5 minutes
const int REBOOT_DELAY_MS    = 150000; // 2.5 minutes in milliseconds
const int MAX_FAILURES       = 3;      // Failures before rebooting

int failureCount = 0;

// Forward declaration
void connectToWiFi();

void setup() {
  Serial.begin(115200);

  // 1. Initialize the pins as OUTPUT
  pinMode(RELAY_ROUTER, OUTPUT);
  pinMode(RELAY_MESH, OUTPUT);

  // 2. IMMEDIATELY force them to keep the power ON
  // For most IoT relays, LOW = Connected/On
  digitalWrite(RELAY_ROUTER, LOW); 
  digitalWrite(RELAY_MESH, LOW);

  connectToWiFi();
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void performReboot() {
  Serial.println("!!! CRITICAL: Internet Failure. Starting Sequenced Reboot !!!");
  
  // 1. Kill power to both
  digitalWrite(RELAY_ROUTER, HIGH); 
  digitalWrite(RELAY_MESH, HIGH);
  delay(10000); // Wait 10 seconds empty
  
  // 2. Power on Router
  Serial.println("Powering on Router...");
  digitalWrite(RELAY_ROUTER, LOW);
  
  // 3. Wait for Router to fully stabilize
  Serial.println("Waiting 2 minutes for Router sequence...");
  delay(REBOOT_DELAY_MS);
  
  // 4. Power on Mesh
  Serial.println("Powering on Mesh Network...");
  digitalWrite(RELAY_MESH, LOW);
  
  failureCount = 0; // Reset counter
  Serial.println("Reboot Cycle Complete.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Check two different hosts to be sure
  bool googleUp = Ping.ping("8.8.8.8", 3);
  bool cloudflareUp = Ping.ping("1.1.1.1", 3);

  if (googleUp || cloudflareUp) {
    Serial.println("Internet is ALIVE.");
    failureCount = 0;
  } else {
    failureCount++;
    Serial.printf("Internet FAIL detected. Failure %d of %d\n", failureCount, MAX_FAILURES);
  }

  if (failureCount >= MAX_FAILURES) {
    performReboot();
  }

  delay(PING_INTERVAL_MINS * 60 * 1000);
}