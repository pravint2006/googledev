
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Cpu, Rss, Waypoints } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HardwarePage() {
  const valveControllerCode = `
// Firebase-ESP32 Library: https://github.com/mobizt/Firebase-ESP-Client
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"

// --- DEVICE CONFIGURATION ---
#define DEVICE_TYPE "VALVE_CONTROLLER"

// --- YOUR CREDENTIALS & IDs ---
const char* APN = "YOUR_APN"; // e.g., "internet" for most carriers
const char* GPRS_USER = "";
const char* GPRS_PASS = "";

#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "YOUR_FIREBASE_DB_URL"

#define USER_ID "THE_USER_ID_FOR_THIS_FARM"
#define FARM_ID "THE_FARM_ID_FOR_THIS_DEVICE"
#define VALVE_ID "THE_GATE_VALVE_ID_FOR_THIS_DEVICE"

// --- HARDWARE PINS ---
#define RELAY_PIN 23

// --- FIREBASE OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void streamCallback(StreamData data) {
  Serial.println("Stream data received!");
  if (data.dataType() == "string" && data.dataPath().endsWith("/status")) {
    String newStatus = data.stringData();
    Serial.printf("New Valve Status: %s\\n", newStatus.c_str());

    if (newStatus == "open") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("RELAY ON - Valve Opened");
    } else {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("RELAY OFF - Valve Closed");
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) Serial.println("Stream timeout, restarting stream...");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure valve is closed on startup
  Serial.println("--- AgriGate Valve Controller ---");

  // --- CONNECT TO GSM (ADAPT FOR YOUR MODULE) ---
  Serial.println("Initializing GSM module...");
  // Your specific GSM module init code here (e.g., for SIM800, SIM7600)
  Serial.println("GSM Connected.");

  // --- CONFIGURE FIREBASE ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = "device@example.com";
  auth.user.password = "a_secure_password_for_device";
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // --- START LISTENING TO FIRESTORE ---
  String path = "users/" + String(USER_ID) + "/farms/" + String(FARM_ID) + "/gateValves/" + String(VALVE_ID);
  if (!Firebase.Firestore.beginStream(&fbdo, path.c_str())) {
    Serial.printf("Stream begin error: %s\\n", fbdo.errorReason().c_str());
    return;
  }
  Firebase.Firestore.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
  Serial.printf("Listening for changes at: %s\\n", path.c_str());
}

void loop() {
  // Firebase library requires this call to process events.
  // The logic is handled in the streamCallback.
  delay(1000);
}
  `;

  const motorControllerCode = `
// Firebase-ESP32 Library: https://github.com/mobizt/Firebase-ESP-Client
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"

// --- DEVICE CONFIGURATION ---
#define DEVICE_TYPE "MOTOR_CONTROLLER"

// --- YOUR CREDENTIALS & IDs ---
const char* APN = "YOUR_APN"; // e.g., "internet" for most carriers
const char* GPRS_USER = "";
const char* GPRS_PASS = "";

#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "YOUR_FIREBASE_DB_URL"

#define USER_ID "THE_USER_ID_FOR_THIS_FARM"
#define FARM_ID "THE_FARM_ID_FOR_THIS_DEVICE"
#define MOTOR_ID "THE_MOTOR_ID_FOR_THIS_DEVICE"

// --- HARDWARE PINS ---
#define RELAY_PIN 23

// --- FIREBASE OBJECTS ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void streamCallback(StreamData data) {
  Serial.println("Stream data received!");
  if (data.dataType() == "string" && data.dataPath().endsWith("/status")) {
    String newStatus = data.stringData();
    Serial.printf("New Motor Status: %s\\n", newStatus.c_str());

    if (newStatus == "on") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("RELAY ON - Motor Started");
    } else {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("RELAY OFF - Motor Stopped");
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) Serial.println("Stream timeout, restarting stream...");
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure motor is off on startup
  Serial.println("--- AgriGate Motor Controller ---");

  // --- CONNECT TO GSM (ADAPT FOR YOUR MODULE) ---
  Serial.println("Initializing GSM module...");
  // Your specific GSM module init code here (e.g., for SIM800, SIM7600)
  Serial.println("GSM Connected.");

  // --- CONFIGURE FIREBASE ---
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = "device@example.com";
  auth.user.password = "a_secure_password_for_device";
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // --- START LISTENING TO FIRESTORE ---
  String path = "users/" + String(USER_ID) + "/farms/" + String(FARM_ID) + "/motors/" + String(MOTOR_ID);
  if (!Firebase.Firestore.beginStream(&fbdo, path.c_str())) {
    Serial.printf("Stream begin error: %s\\n", fbdo.errorReason().c_str());
    return;
  }
  Firebase.Firestore.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
  Serial.printf("Listening for changes at: %s\\n", path.c_str());
}

void loop() {
  // Firebase library requires this call to process events.
  // The logic is handled in the streamCallback.
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
          How to connect an ESP32 with a GSM module to control your farm devices.
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
                  <p className="font-semibold">Relay & Device</p>
              </div>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>You toggle a device in the **AgriGate Manager App**.</li>
            <li>The app updates the device's status in the **Firebase Firestore** database.</li>
            <li>The **ESP32**, connected via the **GSM Module**, is listening for changes to that specific device in Firestore.</li>
            <li>When the change is detected, the ESP32 sends a signal to a **Relay Module**.</li>
            <li>The Relay Module opens or closes the circuit for the **Solenoid Valve** or **Motor**.</li>
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
            Use the correct code for your device type. You'll need the Mobizt Firebase-ESP-Client library and to adapt the GSM connection logic for your specific module. Before uploading, you must fill in your API key, database URL, and device-specific IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="valve">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="valve">Valve Controller</TabsTrigger>
              <TabsTrigger value="motor">Motor Controller</TabsTrigger>
            </TabsList>
            <TabsContent value="valve" className="mt-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>
                  {valveControllerCode.trim()}
                </code>
              </pre>
            </TabsContent>
            <TabsContent value="motor" className="mt-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>
                  {motorControllerCode.trim()}
                </code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    