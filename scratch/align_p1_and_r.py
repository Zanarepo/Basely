import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def align_p_leg1_and_white_r():
    # Load model image
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
    
    # 1. Extract P icon mark (top half)
    # Icon crop: x=165..415, y=135..415
    icon_crop = clean.crop((165, 135, 415, 415))
    
    # 2. Extract "razaner" text (bottom half)
    # Text crop: x=185..872, y=410..550
    text_crop = clean.crop((185, 410, 872, 550))
    
    # Find exact pixel column bounds for the 1st leg of P in icon_crop:
    icon_arr = np.array(icon_crop)
    icon_alpha = icon_arr[:, :, 3]
    
    # Bottom rows of icon_crop (where leg 1 ends)
    bottom_rows = icon_alpha[-20:, :]
    leg1_cols = np.where(bottom_rows > 100)[1]
    leg1_min_x, leg1_max_x = leg1_cols[0], leg1_cols[-1]
    print(f"Icon 1st leg X bounds in icon_crop: {leg1_min_x} to {leg1_max_x}")
    
    # Find exact pixel column bounds for top of white 'r' in text_crop:
    text_arr = np.array(text_crop)
    text_alpha = text_arr[:, :, 3]
    top_rows = text_alpha[:20, :]
    r_cols = np.where(top_rows > 100)[1]
    r_min_x = r_cols[0]
    print(f"Text 'r' top X min in text_crop: {r_min_x}")
    
    # Calculate horizontal offset dx so leg1_min_x matches r_min_x exactly!
    # Icon is placed at icon_x. Text is placed at text_x.
    # We want (icon_x + leg1_min_x) == (text_x + r_min_x)
    icon_x = 50
    text_x = icon_x + leg1_min_x - r_min_x
    print(f"Calculated text_x: {text_x} (Icon X: {icon_x})")
    
    # Find vertical bottom of icon vs top of text to join them seamlessly with zero gap
    # Bottom non-zero Y of icon
    icon_nonzero_y = np.where(icon_alpha > 50)[0]
    icon_bottom_y = icon_nonzero_y[-1]
    
    # Top non-zero Y of text
    text_nonzero_y = np.where(text_alpha > 50)[0]
    text_top_y = text_nonzero_y[0]
    
    icon_y = 40
    # Place text so text_y + text_top_y overlaps slightly with icon_y + icon_bottom_y
    # Overlap by 4 pixels to seamlessly fuse without any separation line!
    text_y = icon_y + icon_bottom_y - text_top_y - 4
    
    print(f"Calculated text_y: {text_y}")
    
    # Render composite image
    cw, ch = 800, 560
    comp = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    comp.paste(icon_crop, (icon_x, icon_y), icon_crop)
    comp.paste(text_crop, (text_x, text_y), text_crop)
    
    # Draw seamless bridge connecting the 1st leg base directly into the top of white r
    bridge_draw = ImageDraw.Draw(comp)
    # Bridge box coordinates
    b_left = icon_x + leg1_min_x
    b_right = icon_x + leg1_min_x + 32 # Width of 1st leg
    b_top = icon_y + icon_bottom_y - 6
    b_bottom = text_y + text_top_y + 8
    
    # Fill bridge with solid white or smooth gradient transition so they are 100% ONE ITEM!
    bridge_draw.rectangle([b_left, b_top, b_right, b_bottom], fill=(255, 255, 255, 255))
    
    # Re-paste icon over top so icon 3D texture blends seamlessly into white bridge
    comp.paste(icon_crop, (icon_x, icon_y), icon_crop)

    # Crop tight bbox
    bb = comp.getbbox()
    cropped = comp.crop(bb)
    pad = 40
    padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    # Save transparent RGBA
    padded.save('public/prazaner_logo_leg1_matched_transparent.png')
    padded.save('public/prazaner_logo_transparent.png')
    
    # Save Dark Slate (#020617) presentation
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

    # Save White background presentation
    white = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 255))
    w_shadow = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=6))
    white.paste((15, 23, 42, 140), (pos_x, pos_y + 4), w_shadow)
    white.paste(padded, (pos_x, pos_y), padded)
    white.save('public/prazaner_logo_leg1_matched_white.png')
    white.save('public/prazaner_logo_white_bg.png')
    white.save('public/prazaner_logo.png')

    print("Leg 1 and top of white 'r' matched perfectly and saved!")

align_p_leg1_and_white_r()
