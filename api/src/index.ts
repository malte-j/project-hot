import { Hono } from "hono";
import { downloadAndConvertImage, processImage } from "./utils/pixelizeImage";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { messages } from "../db/schema/messages";
import { apiKeys } from "../db/schema/apiKeys";
import { createMiddleware } from "hono/factory";
import { eq, isNull } from "drizzle-orm";

interface Context {
  Bindings: CloudflareBindings;
  Variables: {
    db: DrizzleD1Database;
  };
}

const app = new Hono<Context>();

app.use("*", async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set("db", db);
  await next();
});

const isAuthenticated = createMiddleware<Context>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const keys = await c.get("db").select().from(apiKeys).all();

  const key = keys.find((key) => authHeader === `Bearer ${key.key}`);

  if (!key) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

app.post("/consumeMessage", isAuthenticated, async (c) => {
  const db = c.get("db");

  const message = await db
    .select()
    .from(messages)
    .where(isNull(messages.readAt))
    .get();

  if (!message) {
    return c.json({ error: "No message found" }, 404);
  }

  // readAt looks like this: 2024-04-11 15:40:43
  await db
    .update(messages)
    .set({
      readAt: new Date().toISOString().replace("T", " ").replace("Z", ""),
    })
    .where(eq(messages.id, message.id))
    .run();

  return c.json({ ...message, images: JSON.parse(message.images ?? "[]") });
});

// get an image from the bucket by its UUID
app.get("/image/:uuid", isAuthenticated, async (c) => {
  const uuid = c.req.param("uuid");
  const image = await c.env.BUCKET.get(`images/${uuid}`);

  if (!image) {
    return c.json({ error: "Image not found" }, 404);
  }

  return c.body(image.body, 200);
});

// given an image url, preview it and return the pixelized png

app.post("/preview", isAuthenticated, async (c) => {
  const url = await c.req.param("url");
  if(!url) {
    return c.json({ error: "No url provided" }, 400);
  }
  
  const image = fetch()
  





// app.get("/messages", isAuthenticated, async (c) => {
//   const db = drizzle(c.env.DB);
//   const result = await c.get("db").select().from(messages).limit(10).all();
//   return Response.json(result);
// });

app.post("/incomingWebhook", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.parseBody();

  console.log(body);

  const numMedia = parseInt(body.NumMedia as string);
  let images = [];

  for (let i = 0; i < numMedia; i++) {
    const processedImage = await downloadAndConvertImage(
      body["MediaUrl" + i] as string
    );

    const imageUUID = crypto.randomUUID();
    await c.env.BUCKET.put(`images/${imageUUID}`, processedImage.buffer);
    images.push(imageUUID);
  }

  await db.insert(messages).values({
    message: body.Body as string,
    images: JSON.stringify(images),
  });

  return c.status(200);
});

export default app;
