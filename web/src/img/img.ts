import { nanoid } from "nanoid";
import sharp from "sharp";
import util from "util";
import fs from "fs/promises";
import { exec as exec2 } from "child_process";
const exec = util.promisify(exec2);
import Jimp from "jimp";
import { TEMP_DIR } from "../config";

export async function downloadAndConvertImage(url: string, imageUUID: string) {
  const imageWidth = 380;
  const imageHeight = 380;

  const imagePath = TEMP_DIR + imageUUID + ".jpg";

  // use sharp to download and resize image
  const image = await fetch(url);
  const imageBuffer = await image.arrayBuffer();
  await sharp(imageBuffer, {})
    .resize(imageWidth, imageHeight)
    .toFile(imagePath);

  // convert to bmp
  await exec(
    `convert ${imagePath} -ordered-dither o8x8 -monochrome ${TEMP_DIR}${imageUUID}.png`
  );

  await convertImageToBitmap(
    `${TEMP_DIR}${imageUUID}.png`,
    `${TEMP_DIR}${imageUUID}.bin`
  );
}

export async function convertImageToBitmap(
  filename: string,
  outputFilename: string
) {
  const image = await Jimp.read(filename);
  const rowBytes = Math.ceil(image.bitmap.width / 8);
  const totalBytes = rowBytes * image.bitmap.height;
  const buffer = Buffer.alloc(totalBytes);

  image.grayscale().contrast(1); // Convert image to B&W

  let byteNum = 0;
  let pixelNum = 0;
  for (let y = 0; y < image.bitmap.height; y++) {
    for (let x = 0; x < rowBytes; x++) {
      let sum = 0;
      const lastBit =
        x < rowBytes - 1 ? 1 : 1 << (rowBytes * 8 - image.bitmap.width);
      for (let b = 128; b >= lastBit; b >>= 1) {
        const pixel = Jimp.intToRGBA(
          image.getPixelColor(
            pixelNum % image.bitmap.width,
            Math.floor(pixelNum / image.bitmap.width)
          )
        );
        if ((pixel.r & 1) === 0) sum |= b; // If black pixel, set bit
        pixelNum++;
      }
      buffer[byteNum++] = sum;
    }
  }

  // Save to file
  return fs.writeFile(outputFilename, buffer);
}
