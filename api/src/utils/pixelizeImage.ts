import {
  adjust_contrast,
  darken_lch,
  dither,
  grayscale_human_corrected,
  PhotonImage,
  resize,
  SamplingFilter,
  threshold,
} from "@cf-wasm/photon";

/**
 * Pixelizes an image by resizing it, converting it to grayscale, applying dithering, and applying a threshold.
 *
 * @param inputBytes - The input image data as a Uint8Array.
 * @returns A PhotonImage instance representing the pixelized image.
 */
export function processImage(inputBytes: Uint8Array): {
  image: PhotonImage;
  width: number;
  height: number;
} {
  // create a PhotonImage instance
  const inputImage = PhotonImage.new_from_byteslice(inputBytes);

  const originalWidth = inputImage.get_width();
  const originalHeight = inputImage.get_height();
  const scaledHeight = Math.round((originalHeight / originalWidth) * 384);

  // resize image using photon
  let outputImage = resize(
    inputImage,
    384,
    scaledHeight,
    SamplingFilter.Nearest
  );

  darken_lch(outputImage, 0.3);
  adjust_contrast(outputImage, -15);

  grayscale_human_corrected(outputImage);
  dither(outputImage, 1);
  threshold(outputImage, 90);

  inputImage.free();

  return {
    image: outputImage,
    width: 384,
    height: scaledHeight,
  };
}

/**
 * Downloads an image from the provided URL and converts it to a Uint8Array.
 *
 * @param url - The URL of the image to download and convert.
 * @returns A Uint8Array representing the image data.
 */
export async function fetchAsUint8Array(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Downloads an image from the provided URL and converts it to a Uint8Array.
 *
 * @param imageUrl - The URL of the image to download and convert.
 * @returns A Uint8Array representing the image data.
 */
export async function downloadAndConvertImage(imageUrl: string) {
  // fetch image and get the Uint8Array instance
  const inputBytes = await fetchAsUint8Array(imageUrl);

  const { image, width, height } = processImage(inputBytes);

  // given the raw pixels in Uint8Array format
  const rawPixels = image.get_raw_pixels();

  image.free();

  // convert to uint8 array, where each byte represents 8 pixels
  const bytes = rawPixels.length / 4 / 8;
  const OneBitImage = new Uint8Array(bytes + 4); // the first four bytes are the width and height

  // encode to fit this c-code
  // uint8_t tmp;
  // uint16_t width, height;

  // tmp = fromStream->read();
  // width = (fromStream->read() << 8) + tmp;

  // tmp = fromStream->read();
  // height = (fromStream->read() << 8) + tmp;

  // the first byte is the 8 last bits of with
  OneBitImage[0] = width & 0b11111111;

  // the second byte is the 8 first bits of with
  OneBitImage[1] = (width >> 8) & 0b11111111;

  // the third byte is the 8 last bits of height
  OneBitImage[2] = height & 0b11111111;

  // the fourth byte is the 8 first bits of height
  OneBitImage[3] = (height >> 8) & 0b11111111;

  // OneBitImage[4] = 0b10101010;
  // OneBitImage[5] = 0b11001100;

  // for each pixel in the rawPixels array, set the corrosponding bit in the Uint8Array
  for (let nthPixel = 0; nthPixel < rawPixels.length / 4; nthPixel++) {
    // because the image is black and white, we only need to check the first pixel
    const currByte = Math.floor(nthPixel / 8) + 4;
    const currBitOfByte = 7 - (nthPixel % 8);
    const pixelRChannel = rawPixels[nthPixel * 4];

    if (pixelRChannel > 128) {
      OneBitImage[currByte] |= 1 << currBitOfByte;
    }
  }

  // invert the bits
  for (let i = 4; i < OneBitImage.length; i++) {
    OneBitImage[i] = ~OneBitImage[i];
  }

  return OneBitImage;
}
