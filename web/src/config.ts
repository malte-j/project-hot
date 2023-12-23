import fs from "fs";

export const PORT = parseInt(process.env.PORT || "3000", 10);
export const HOST = process.env.HOST || "localhost";
export const TEMP_DIR = "/tmp/project-hot/";

fs.mkdirSync(TEMP_DIR, { recursive: true });
