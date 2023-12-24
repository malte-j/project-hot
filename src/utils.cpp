#include <Arduino.h>
#include "utils.h"

/**
 * Receives a String and breaks lines accordingly
 */
String wrapLines(const String &in)
{
  String out = "";
  String curr = "";
  unsigned int lineLen = 0;
  unsigned int maxLen = 32;

  for (unsigned int i = 0; i < in.length(); i++)
  {
    if (in[i] == '\n')
    {
      int newLen = lineLen + curr.length();

      if (newLen > maxLen)
      {
        out += '\n' + curr + '\n';
        lineLen = 0;
      }
      else if (newLen == maxLen)
      {
        out += curr + '\n';
        lineLen = 0;
      }
      else
      {
        out += curr + '\n';
        lineLen = 0;
      }
      curr = "";
    }
    else if (in[i] == ' ' || i == in.length() - 1)
    {
      int newLen = lineLen + curr.length();

      if (newLen > maxLen)
      {
        out += '\n' + curr + ' ';
        lineLen = curr.length() + 1;
      }
      else if (newLen == maxLen)
      {
        out += curr + '\n';
        lineLen = 0;
      }
      else
      {
        out += curr + ' ';
        lineLen += curr.length() + 1;
      }

      curr = "";
    }
    else
    {
      curr += in[i];
    }
  }

  return out;
}

/**
 * Replaces Umlaute with correct bytes for printer
 */
String format(String s)
{
  // switch to correct encoding

  s.replace("Ä", String((char)0x8E));
  s.replace("ä", String((char)0x84));

  s.replace("Ö", String((char)0x99));
  s.replace("ö", String((char)0x94));

  s.replace("Ü", String((char)0x9A));
  s.replace("ü", String((char)0x81));

  s.replace("ß", String((char)0xE1));

  s.replace("'", String((char)0x27));
  s.replace("`", String((char)0x27));
  s.replace("´", String((char)0x27));
  s.replace("‘", String((char)0x27));

  // Eins ‘ a

  return wrapLines(s);
}