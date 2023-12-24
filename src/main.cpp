#include <Arduino.h>
#include "secrets.h"
#include "WiFi.h"
#include "Adafruit_Thermal.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include "utils.h"

// Adafruit_Thermal printer(&Serial1);
Adafruit_Thermal printer(&Serial0);

void setup()
{
  WiFiManager wm;

  bool res = wm.autoConnect("printerbox");
  if (!res)
  {
    Serial.println("Failed to connect");
  }
  else
  {
    // if you get here you have connected to the WiFi
    Serial.println("connected to wifi)");
  }


  Serial0.begin(9600, SERIAL_8N1, -1, -1);
  printer.begin();
  printer.setCharset(CHARSET_GERMANY);

  Serial.begin(115200);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
}

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
  String from = doc["from"];

  if (type == "text")
  {
    printer.online();
    printer.println(format(content));
    printer.println("From: " + from);
    Serial.println(content);
    printer.feed(4);
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
      printer.printBitmap(380, 380, stream);
      printer.println();
      printer.println("From: " + from);
      printer.feed(4);
    }
    else
    {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }

    // Free resources
    http2.end();
  }
}

void loop()
{
  getMessageAndPrint();
  delay(800);
}
