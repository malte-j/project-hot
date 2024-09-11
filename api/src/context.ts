import { DrizzleD1Database } from "drizzle-orm/d1";

export interface Context {
  Bindings: CloudflareBindings;
  Variables: {
    db: DrizzleD1Database;
  };
}
