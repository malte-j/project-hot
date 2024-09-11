import { createMiddleware } from "hono/factory";
import { Context } from "../context";
import { apiKeys } from "../../db/schema/apiKeys";

/**
 * Middleware that checks if the incoming request is authenticated by verifying
 * the API key in the Authorization header and comparing it with the keys stored
 * in the database If the API key is invalid, the middleware returns a 401 Unauthorized
 * response.
 *
 * @param c - The Hono context object
 * @param next - A function that calls the next middleware in the chain.
 */
export const isAuthenticated = createMiddleware<Context>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const keys = await c.get("db").select().from(apiKeys).all();
  const key = keys.find((key) => authHeader === `Bearer ${key.key}`);

  if (!key) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
