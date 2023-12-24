from PIL import Image
import numpy as np

def bitmap_to_image(filename, width, height):
    with open(filename, 'rb') as f:
        data = f.read()

    # Convert data to a 1D numpy array of 8-bit unsigned integers
    data = np.frombuffer(data, dtype=np.uint8)

    # Convert each byte to 8 bits
    data = np.unpackbits(data)

    # If the image width is not a multiple of 8, remove extra bits at the end of each row
    if width % 8 != 0:
        data = data.reshape(-1, width // 8 * 8 + 8)[:,:width]

    # Reshape the data into a 2D array
    data = data.reshape(height, width)

    # Create an image from the data and save it
    img = Image.fromarray(data * 255, 'L')  # 'L' for 8-bit pixels, black and white
    img.save(filename + '.png')

bitmap_to_image('huqVLxkvUnTz_XTQ---9K.bin', 256, 256)
