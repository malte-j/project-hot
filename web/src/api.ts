import bodyParser from "body-parser";
import express from "express";
import { nanoid } from "nanoid";
import { downloadAndConvertImage } from "./img/img";
import { prisma } from "./prisma";
import { validateAuthToken } from "./util";

export const apiRouter = express.Router();

apiRouter.get("/nextMessage", validateAuthToken, async (req, res) => {
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

apiRouter.post(
  "/incomingWebhook",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    console.log("incoming webhook");
    console.log("body: ", req.body);

    let imageUrl: string | null = null;

    // if image
    if (req.body.NumMedia > 0) {
      const imageUUID = nanoid();
      await downloadAndConvertImage(req.body.MediaUrl0, imageUUID);
      imageUrl = "/images/" + imageUUID + ".bin";
    }

    await prisma.message.create({
      data: {
        type: "image",
        from: req.body.ProfileName || "unknown",
        content: req.body.Body,
        imageUrl,
      },
    });
  }
);
