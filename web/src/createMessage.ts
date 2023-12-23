import { prisma } from "./prisma";

async function init() {
  console.log("initiating...");

  await prisma.message.create({
    data: {
      content: "Hi there, World!",
      from: "Malte",
      type: "text",
    },
  });
}

init().then(() => console.log("done"));
