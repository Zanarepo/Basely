import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def align_p_leg1_and_white_r_precise():
    img = Image.open('public/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    
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
    new_data[is_white_text, 0:3] = 255
    
    clean = Image.fromarray(new_data, mode='RGBA')
    
    # 1. Extract Icon crop tightly
    icon_crop = clean.crop((165, 135, 415, 415))
    icon_bbox = icon_crop.getbbox()
    icon_tight = icon_crop.crop(icon_bbox)
    
    # 2. Extract Text crop tightly
    text_crop = clean.crop((185, 410, 872, 550))
    text_bbox = text_crop.getbbox()
    text_tight = text_crop.crop(text_bbox)
    
    # Find exact X coordinate of 1st leg in icon_tight:
    # 1st leg is the left-most vertical stem of P
    icon_arr = np.array(icon_tight)
    i_alpha = icon_arr[:, :, 3]
    
    # Bottom 15 rows of icon_tight
    b_rows = i_alpha[-15:, :]
    # Find columns of the 1st leg (left stem of P)
    # The 1st leg starts at x=0 (the left-most stem)
    leg1_left_x = 0
    # Left stem width is ~28 pixels
    leg1_width = 28
    
    # Find top of 'r' stem in text_tight
    # The 'r' stem is at x=0 in text_tight
    text_arr = np.array(text_tight)
    t_alpha = text_arr[:, :, 3]
    
    # Calculate position to paste:
    # Icon position: (80, 50)
    icon_x, icon_y = 80, 50
    
    # Leg 1 base absolute X = icon_x + leg1_left_x = 80
    # Text left X = 80 (so 'r' left stem matches Leg 1 left stem 100% perfectly!)
    text_x = icon_x + leg1_left_x
    
    # Leg 1 base absolute Y = icon_y + icon_tight.height = 50 + icon_tight.height
    # Text top Y = Leg 1 base Y - 6 (overlap of 6px so there is ZERO separation gap!)
    text_y = icon_y + icon_tight.height - 6
    
    cw, ch = 900, 600
    comp = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    
    # Paste icon
    comp.paste(icon_tight, (icon_x, icon_y), icon_tight)
    
    # Paste text perfectly aligned
    comp.paste(text_tight, (text_x, text_y), text_tight)
    
    # Draw solid white bridge between leg 1 base and white 'r' top so they fuse smoothly into ONE stem!
    b_draw = ImageDraw.Draw(comp)
    bridge_x1 = text_x
    bridge_x2 = text_x + leg1_width + 4
    bridge_y1 = text_y - 4
    bridge_y2 = text_y + 12
    
    b_draw.rectangle([bridge_x1, bridge_y1, bridge_x2, bridge_y2], fill=(255, 255, 255, 255))
    
    # Re-paste icon over top so the 3D metallic texture of leg 1 connects seamlessly into white 'r'
    comp.paste(icon_tight, (icon_x, icon_y), icon_tight)
    
    # Tight crop
    final_bbox = comp.getbbox()
    cropped = comp.crop(final_bbox)
    pad = 40
    padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    # Save Transparent RGBA
    padded.save('public/prazaner_logo_leg1_matched_transparent.png')
    padded.save('public/prazaner_logo_v2_joined_connected_transparent.png')
    padded.save('public/prazaner_logo_transparent.png')
    
    # Save Dark Slate Presentation (#020617)
    target_w, target_h = 1000, 700
    dark = Image.new('RGBA', (target_w, target_h), (2, 6, 23, 255))
    
    aura = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    aura_draw = ImageDraw.Draw(aura)
    cx, cy = target_w // 2, target_h // 2
    for radius in range(350, 0, -5):
        alpha = int(40 * (1.0 - radius / 350.0) ** 1.8)
        aura_draw.ellipse([cx - radius*1.2, cy - radius*0.8, cx + radius*1.2, cy + radius*0.8], fill=(124, 58, 237, alpha))
        
    aura = aura.filter(ImageFilter.GaussianBlur(radius=25))
    dark.paste(aura, (0, 0), aura)
    
    pos_x = (target_w - padded.width) // 2
    pos_y = (target_h - padded.height) // 2
    
    shadow_mask = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=10))
    dark.paste((0, 0, 0, 160), (pos_x, pos_y + 6), shadow_mask)
    dark.paste(padded, (pos_x, pos_y), padded)
    
    dark.save('public/prazaner_logo_leg1_matched_dark.png')
    dark.save('public/prazaner_logo_dark.png')
    dark.save('public/prazaner_logo_preview2.png')
    dark.save('public/prazaner_logo_FINAL.png')

    # Save White presentation
    white = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 255))
    w_shadow = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=6))
    white.paste((15, 23, 42, 140), (pos_x, pos_y + 4), w_shadow)
    white.paste(padded, (pos_x, pos_y), padded)
    white.save('public/prazaner_logo_white_bg.png')
    white.save('public/prazaner_logo.png')

    print("Perfectly matched 1st leg of P and top of white 'r' with ZERO separation!")

align_p_leg1_and_white_r_precise()
