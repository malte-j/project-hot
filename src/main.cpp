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

void dump()
{
  uint8_t major, minor, c;

  printer.println(F("        01234567  89ABCDEF"));
  for (major = 0; major < 16; major++)
  {
    printer.print(F("     "));
    printer.print(major, HEX);
    printer.print(F("- "));
    for (minor = 0; minor < 16; minor++)
    {
      c = (major << 4) | minor;
      if (c < 32)
        c = ' '; // Skip control codes!
      printer.write(c);
      if (minor == 7)
        printer.print(F("  "));
    }
    printer.println();
  }
}

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

  dump();
}

void getMessageAndPrint()
{
  HTTPClient http;
  WiFiClient client;

  http.addHeader("authorization", String(API_TOKEN));
  http.begin(client, "http://print.malts.me/api/nextMessage?deviceId=" + String(THINGNAME));

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
    printer.println(format(content + "."));
    printer.println("Von: " + from);
    Serial.println(content);
    printer.feed(4);
  }
  else if (type == "image")
  {
    // download image
    HTTPClient http2;

    Serial.println("Downloading image from " + imageUrl);
    http2.begin(client, "http://print.malts.me" + imageUrl);

    int httpResponseCode = http2.GET();
    if (httpResponseCode > 0)
    {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);

      Stream *stream = http2.getStreamPtr();
      printer.online();
      printer.printBitmap(380, 420, stream);
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
    // http2.end();
  }
}

void loop()
{
  getMessageAndPrint();
  delay(800);
}
