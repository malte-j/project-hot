// load apitoken and deviceid from env

import { prisma } from "./prisma";

async function init() {
  console.log("initiating...");
  const apiToken = process.env.API_TOKEN;
  if (!apiToken) throw new Error("API_TOKEN not found");

  const deviceId = process.env.DEVICE_ID;
  if (!deviceId) throw new Error("DEVICE_ID not found");

  await prisma.apiToken.create({
    data: {
      token: apiToken,
    },
  });

  await prisma.cursor.create({
    data: {
      cursor: 0,
      deviceID: deviceId,
    },
  });
}

init().then(() => console.log("done"));
