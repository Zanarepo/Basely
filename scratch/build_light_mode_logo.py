import numpy as np
from PIL import Image

def build_light_logo():
    # Load transparent logo
    img = Image.open('public/prazaner_logo_transparent.png').convert('RGBA')
    arr = np.array(img)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]
    
    # White text pixels: bright white (r > 200, g > 200, b > 200, a > 50)
    is_white_text = (r > 200) & (g > 200) & (b > 200) & (a > 50)
    
    # Copy array for light mode logo
    light_arr = arr.copy()
    
    # Replace white text with dark slate (#0f172a) for light mode visibility
    light_arr[is_white_text, 0] = 15  # R
    light_arr[is_white_text, 1] = 23  # G
    light_arr[is_white_text, 2] = 42  # B
    
    light_img = Image.fromarray(light_arr, mode='RGBA')
    light_img.save('public/prazaner_logo_light.png')
    light_img.save('public/logo/mainlogowhite.png')
    
    print("prazaner_logo_light.png created successfully!")

build_light_logo()
