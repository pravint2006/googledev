'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Cpu, Rss, Waypoints } from "lucide-react";

export default function HardwarePage() {
  const arduinoCode = `
// Firebase-ESP32 Library: https://github.com/mobizt/Firebase-ESP-Client
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"

// Your GSM Module's APN credentials
const char* APN = "YOUR_APN"; // e.g., "internet" for most carriers
const char* GPRS_USER = "";
const char* GPRS_PASS = "";

// Your Firebase project credentials from your app's config
#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "YOUR_FIREBASE_DATABASE_URL" // e.g., "my-project-id.firebaseio.com"

// The specific User and Farm this device belongs to
#define USER_ID "THE_USER_ID_FOR_THIS_FARM"
#define FARM_ID "THE_FARM_ID_FOR_THIS_DEVICE"

// The specific Valve this device controls
#define VALVE_ID "THE_GATE_VALVE_ID_FOR_THIS_DEVICE"
#define VALVE_INDEX 0 // The index of the valve in the 'gateValves' array

// Pin connected to the Relay Module
#define RELAY_PIN 23

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool taskCompleted = false;

// Callback function that runs when the valve status changes in Firestore
void streamCallback(StreamData data) {
  Serial.println("Stream data received!");

  // The path to the specific field that changed
  String path = data.dataPath();
  Serial.printf("Path: %s\\n", path.c_str());

  // We only care about changes to the 'status' field of our valve
  if (path.endsWith("/status")) {
    String newStatus = data.stringData();
    Serial.printf("New Valve Status: %s\\n", newStatus.c_str());

    if (newStatus == "open") {
      digitalWrite(RELAY_PIN, HIGH); // Turn the relay ON
      Serial.println("RELAY ON - Valve Opened");
    } else if (newStatus == "closed") {
      digitalWrite(RELAY_PIN, LOW); // Turn the relay OFF
      Serial.println("RELAY OFF - Valve Closed");
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("Stream timeout, restarting stream...");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure valve is closed on startup

  Serial.println("--- AgriGate Valve Controller ---");

  // --- Connect to GSM ---
  // (Your specific GSM module initialization code goes here)
  // This is a generic example. You will need to adapt this part
  // for your specific GSM module (e.g., SIM800L, SIM7600).
  Serial.println("Initializing GSM module...");
  // e.g., Serial2.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  // delay(3000);
  // modem.init();
  // modem.gprsConnect(APN, GPRS_USER, GPRS_PASS);
  // ... wait for connection
  Serial.println("GSM Connected.");


  // --- Configure Firebase ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = "device@example.com"; // Use a placeholder for device auth
  auth.user.password = "device_password"; // A secure password for device users

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true); // For GSM, this helps manage reconnections

  // --- Start Listening to Firestore ---
  String documentPath = "users/" + String(USER_ID) + "/farms/" + String(FARM_ID);
  
  // Listen for changes ONLY on the 'gateValves' field of the farm document.
  // This is more efficient than streaming the whole document.
  // We specify the index of the valve we care about.
  String nodePath = "gateValves/" + String(VALVE_INDEX);

  if (!Firebase.Firestore.beginStream(&fbdo, documentPath.c_str(), nodePath.c_str())) {
    Serial.printf("Stream begin error: %s\\n", fbdo.errorReason().c_str());
    return;
  }

  Firebase.Firestore.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
  Serial.printf("Listening for changes at: %s/%s\\n", documentPath.c_str(), nodePath.c_str());
}

void loop() {
  // This is required for the library to process incoming events
  if (Firebase.ready() && !taskCompleted) {
    taskCompleted = true; // Prevents re-running setup logic
  }
  // The magic happens in the streamCallback function!
  delay(1000);
}
  `;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Hardware Integration Guide
        </h1>
        <p className="text-muted-foreground mt-2">
          How to connect an ESP32 with a GSM module to control your gate valves.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Cpu className="h-6 w-6 text-primary" />
            System Architecture
          </CardTitle>
          <CardDescription>
            This setup uses a cellular connection, making it ideal for remote farm locations without Wi-Fi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                  <p className="font-semibold">Your App</p>
              </div>
              <Waypoints className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-3 text-primary">
                  <Rss className="h-5 w-5" />
                  <p className="font-semibold">Firebase Firestore</p>
              </div>
               <Waypoints className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-3">
                  <p className="font-semibold">ESP32 + GSM Module</p>
              </div>
               <Waypoints className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-3">
                  <p className="font-semibold">Solenoid Valve</p>
              </div>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>You toggle a valve in the **AgriGate Manager App**.</li>
            <li>The app updates the valve's status in the **Firebase Firestore** database.</li>
            <li>The **ESP32**, connected via the **GSM Module**, is listening for changes to that specific valve in Firestore.</li>
            <li>When the change is detected, the ESP32 sends a signal to a **Relay Module**.</li>
            <li>The Relay Module opens or closes the circuit for the **Solenoid Valve**, controlling the water flow.</li>
          </ol>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Code className="h-6 w-6 text-primary" />
            ESP32 Sample Code (Arduino C++)
          </CardTitle>
          <CardDescription>
            This is a starting point for your device's firmware. You'll need the Mobizt Firebase-ESP-Client library and to adapt the GSM connection logic for your specific module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
            <code>
              {arduinoCode.trim()}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
