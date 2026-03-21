#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// WiFi
const char* ssid = "5050";
const char* password = "12345678";

// DS18B20 setup
#define ONE_WIRE_BUS D4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Web server
ESP8266WebServer server(80);

void handleTemp() {
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);

  String json = "{";
  json += "\"temperature\":" + String(tempC);
  json += "}";

  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  sensors.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());  // 👈 USE THIS IP

  server.on("/temp", handleTemp);
  server.begin();
}

void loop() {
  server.handleClient();
}