import bodyParser from "body-parser";
import { exec as exec2 } from "child_process";
import express, { Request, Response } from "express";
import { nanoid } from "nanoid";
import sharp from "sharp";
import util from "util";
import fs from "fs";
import { prisma } from "./prisma";
const exec = util.promisify(exec2);
import Jimp from "jimp";

export const apiRouter = express.Router();
const TEMPDIR = "/tmp/project-hot/";

async function checkToken(req: Request, res: Response, next: any) {
  next();
  return;
  const token = req.headers.authorization;
  console.log("token: ", token);
  if (typeof token !== "string") {
    console.error("token not found: ", req.headers);
    return res.status(401).send("token not found");
  }

  const apiToken = await prisma.apiToken.findFirst({
    where: {
      token: {
        equals: token,
      },
    },
  });

  if (apiToken === null) {
    console.error("token not found");
    return res.status(401).send("token not found");
  }

  next();
}

apiRouter.get("/nextMessage", checkToken, async (req, res) => {
  const deviceId = req.query.deviceId;
  if (typeof deviceId !== "string") {
    console.error("deviceId must be a string");
    return res.status(400).send("deviceId must be a string");
  }

  const cursor = await prisma.cursor.findFirst({
    where: {
      deviceID: {
        equals: deviceId,
      },
    },
  });
  if (cursor === null) {
    console.error("cursor not found");
    return res.status(404).send("cursor not found");
  }

  const message = await prisma.message.findFirst({
    where: {
      id: {
        gt: cursor.cursor,
      },
    },
  });

  if (message === null) {
    return res.status(404).send("no message found");
  }

  res.json(message);

  await prisma.cursor.update({
    where: {
      deviceID: cursor.deviceID,
    },
    data: {
      cursor: message.id,
    },
  });
});

// twilio webhook
/**
 * body:  [Object: null prototype] {
  SmsMessageSid: 'SMe1671264798c921782180fbef220d409',
  NumMedia: '0',
  ProfileName: 'Malte',
  SmsSid: 'SMe1671264798c921782180fbef220d409',
  WaId: '4915170171915',
  SmsStatus: 'received',
  Body: 'I',
  To: 'whatsapp:+16812456958',
  NumSegments: '1',
  ReferralNumMedia: '0',
  MessageSid: 'SMe1671264798c921782180fbef220d409',
  AccountSid: 'ACac93731d0d42a655729afead68c8efe9',
  From: 'whatsapp:+4915170171915',
  ApiVersion: '2010-04-01'
}
 */
apiRouter.post(
  "/incomingWebhook",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    console.log("incoming webhook");

    console.log("body: ", req.body);

    // if image
    if (req.body.NumMedia > 0) {
      const imageUUID = nanoid();
      const imagePath = TEMPDIR + imageUUID + ".jpg";

      // use sharp to download and resize image
      const image = await fetch(req.body.MediaUrl0);
      const imageBuffer = await image.arrayBuffer();
      sharp(imageBuffer, {}).resize(150, 150).toFile(imagePath);

      // convert to bmp
      await exec(
        `convert ${imagePath} -ordered-dither o8x8 -monochrome ${TEMPDIR}${imageUUID}.bmp`
      );

      await convertImageToBitmap(
        `${TEMPDIR}${imageUUID}.bmp`,
        `${TEMPDIR}${imageUUID}.bin`
      );

      await prisma.message.create({
        data: {
          type: "image",
          from: req.body.ProfileName || "unknown",
          content: req.body.Body,
          imageUrl: "/images/" + imageUUID + ".bin",
        },
      });
    } else {
      await prisma.message.create({
        data: {
          type: "text",
          from: req.body.ProfileName || "unknown",
          content: req.body.Body,
        },
      });
    }
  }
);

async function convertImageToBitmap(filename: string, outputFilename: string) {
  const image = await Jimp.read(filename);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const rowBytes = Math.ceil(width / 8);

  // Convert image to B&W
  // image.greyscale().contrast(1);

  let output = Buffer.alloc(rowBytes * height);

  let byteNum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < rowBytes; x++) {
      let sum = 0;
      let lastBit = x < rowBytes - 1 ? 1 : 1 << (rowBytes * 8 - width);
      for (let b = 128; b >= lastBit; b >>= 1) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        
        const isBlack = (pixel.r + pixel.g + pixel.b) / 3 < 128;
        if (isBlack) sum |= b;
      }
      output[byteNum++] = sum;
    }
  }

  fs.writeFileSync(outputFilename, output);
}
