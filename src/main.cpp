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
  // printer.setCharset(CHARSET_GERMANY);

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

  http.addHeader("Authorization", "Bearer " + String(API_TOKEN));
  http.begin(client, "http://print.malts.me/consumeMessage");

  int httpResponseCode = http.POST("");
  String payload = "{}";

  if (httpResponseCode == 404)
  {
    Serial.println("No messages available");
    http.end();
    return;
  }

  if (httpResponseCode >= 400)
  {
    Serial.println("Error in response");
    http.end();
    return;
  }

  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);

  payload = http.getString();

  // Free resources
  http.end();

  // parse json
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload);

  String message = doc["message"];

  if (message.length() > 0)
  {
    Serial.println("Message: " + message);
    printer.online();
    delay(100);
    printer.println(format(message + "."));
    Serial.println(message);
    printer.feed(4);
  }

  if (doc["images"].isNull())
  {
    Serial.println("No images");
  }
  else
  {
    JsonArray images = doc["images"];

    for (JsonVariant image : images)
    {
      String imageUUID = image.as<String>();
      Serial.println("Image URL: " + imageUUID);

      // download image

      HTTPClient http2;

      http2.begin(client, "http://print.malts.me/image/" + imageUUID);
      http2.addHeader("Authorization", "Bearer " + String(API_TOKEN));
      httpResponseCode = http2.GET();

      if (httpResponseCode >= 400)
      {
        Serial.println("Error in response, " + httpResponseCode);
        http2.end();
        continue;
      }

      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);

      Serial.println("Streaming image data for " + imageUUID);

      Stream *stream = http2.getStreamPtr();
      printer.online();

      // try to get
      printer.printBitmap(stream);
      printer.feed(4);

      // free resources
      http2.end();
    }
  }
}

void loop()
{
  getMessageAndPrint();
  delay(7000);
}
