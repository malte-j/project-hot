import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey(),
  message: text("message"),
  images: text("images"), // json array of image ids, e.g. ["2ad31", "diaw029"]
  createdAt: text("createdAt")
    .notNull()
    .default(sql`(current_timestamp)`), // 2024-04-11 15:40:43
  readAt: text("readAt"),
});
