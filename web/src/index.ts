// express app
import express from "express";
import { apiRouter } from "./api";
import { PORT, HOST, TEMP_DIR } from "./config";

const app = express();
app.use("/api", apiRouter);
app.listen(PORT, HOST, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});

// serve images from fs
app.use(
  "/images/",
  express.static(TEMP_DIR, {
    index: false,
    redirect: false,
    immutable: true,
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  })
);
