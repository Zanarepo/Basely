import numpy as np
from PIL import Image, ImageFilter

def perfect_logo():
    # Load model image
    img = Image.open('public/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    
    # Background identification
    is_gray = (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (r < 120)
    is_white_text = (r > 180) & (g > 180) & (b > 180)
    is_purple_icon = (b > g + 10) | (r > g + 10)
    
    new_a = np.zeros_like(r, dtype=np.uint8)
    new_a[is_white_text] = 255
    new_a[is_purple_icon] = 255
    
    transition = ~is_gray & ~is_white_text & ~is_purple_icon
    brightness = (r + g + b) / 3.0
    color_diff = np.maximum(np.abs(r - g), np.abs(b - g))
    edge_alpha = np.clip((color_diff * 4 + (brightness - 50) * 2), 0, 255).astype(np.uint8)
    new_a[transition] = edge_alpha[transition]
    
    new_data = data.copy()
    new_data[:, :, 3] = new_a
    new_data[is_white_text, 0:3] = 255 # Solid pure white text
    
    clean = Image.fromarray(new_data, mode='RGBA')
    
    # Precise crop bounds to avoid edge line artifact:
    # Icon bounds: x=165..415, y=135..415
    # Text bounds: x=170..865 (stop at 865 to cut off far right artifact line!), y=410..545
    icon_crop = clean.crop((165, 135, 415, 415))
    text_crop = clean.crop((170, 410, 860, 545))
    
    # 1. Stacked Logo (Icon top, Text below)
    canvas_w, canvas_h = 700, 480
    stacked = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    stacked.paste(icon_crop, (50, 20), icon_crop)
    stacked.paste(text_crop, (50, 305), text_crop)
    
    bbox_s = stacked.getbbox()
    stacked_cropped = stacked.crop(bbox_s)
    
    pad = 30
    stacked_padded = Image.new('RGBA', (stacked_cropped.width + pad*2, stacked_cropped.height + pad*2), (0, 0, 0, 0))
    stacked_padded.paste(stacked_cropped, (pad, pad), stacked_cropped)
    
    # Save transparent stacked logo
    stacked_padded.save('public/prazaner_logo_transparent.png')
    
    # Save Dark BG logo (#020617)
    dark_bg = Image.new('RGBA', stacked_padded.size, (2, 6, 23, 255))
    dark_bg.paste(stacked_padded, (0, 0), stacked_padded)
    dark_bg.save('public/prazaner_logo_dark.png')
    dark_bg.save('public/prazaner_logo_preview2.png')
    dark_bg.save('public/prazaner_logo_FINAL.png')

    # Save White BG logo (#ffffff)
    white_bg = Image.new('RGBA', stacked_padded.size, (255, 255, 255, 255))
    # Subtle dark drop shadow on white text for white bg
    shadow = stacked_padded.split()[3].filter(ImageFilter.GaussianBlur(radius=2))
    white_bg.paste((15, 23, 42, 180), (0, 2), shadow)
    white_bg.paste(stacked_padded, (0, 0), stacked_padded)
    white_bg.save('public/prazaner_logo_white_bg.png')
    white_bg.save('public/prazaner_logo.png')

    # 2. Horizontal Navbar Logo (Icon left, Solid White Text right)
    nav_h = 75
    scale_icon = nav_h / icon_crop.height
    icon_nav = icon_crop.resize((int(icon_crop.width * scale_icon), nav_h), Image.Resampling.LANCZOS)
    
    scale_text = (nav_h * 0.65) / text_crop.height
    text_nav = text_crop.resize((int(text_crop.width * scale_text), int(text_crop.height * scale_text)), Image.Resampling.LANCZOS)
    
    nav_w = icon_nav.width + text_nav.width + 20
    navbar = Image.new('RGBA', (nav_w + 30, nav_h + 16), (0, 0, 0, 0))
    navbar.paste(icon_nav, (15, 8), icon_nav)
    
    text_y_pos = 8 + int((nav_h - text_nav.height) / 2) + 3
    navbar.paste(text_nav, (15 + icon_nav.width + 14, text_y_pos), text_nav)
    
    navbar.save('public/prazaner_logo_navbar.png')
    navbar.save('public/parzana_logo_navbar.png')
    
    print("Perfect logos rendered successfully!")

perfect_logo()
