#include <Arduino.h>
#include "secrets.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include "WiFi.h"
#include "Adafruit_Thermal.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "utils.h"

// Adafruit_Thermal printer(&Serial1);
Adafruit_Thermal printer(&Serial0);

void setup()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial0.begin(9600, SERIAL_8N1, -1, -1);
  printer.begin();
  printer.setCharset(CHARSET_GERMANY);

  Serial.begin(115200); // TODO:REMOVE

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
}

// make a get request to 49.13.145.83/api/nextMessage?deviceId=$THINGNAME
// returns a json object with type = "text" or "image" and content = "..." or imageUrl = "https://"
// if type == "text" print content
// if type == "image" download image from imageUrl and print it
//

void getMessageAndPrint()
{
  HTTPClient http;
  WiFiClient client;

  http.addHeader("authorization", "E_EL52fgLcf6qUnJ");
  http.begin(client, "http://reptile-up-commonly.ngrok-free.app/api/nextMessage?deviceId=" + String(THINGNAME));

  int httpResponseCode = http.GET();
  String payload = "{}";
  if (httpResponseCode > 0)
  {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    payload = http.getString();
  }
  else
  {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  // Free resources
  http.end();

  // parse json
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload);
  String type = doc["type"];
  String content = doc["content"];
  String imageUrl = doc["imageUrl"];

  if (type == "text")
  {
    printer.online();
    printer.println(format(content));
    Serial.println(content);
    // feed
    printer.feed(10);
  }
  else if (type == "image")
  {
    // download image
    HTTPClient http2;
    WiFiClient client;

    Serial.println("Downloading image from " + imageUrl);
    http2.begin(client, "http://reptile-up-commonly.ngrok-free.app" + imageUrl);

    int httpResponseCode = http2.GET();
    if (httpResponseCode > 0)
    {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);

      Stream *stream = http2.getStreamPtr();
      printer.printBitmap(150, 150, stream);
    }
    else
    {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }

    // Free resources
    http.end();
  }
}

void loop()
{
  // printer.println("Hello World");
  getMessageAndPrint();
  delay(800);
}
