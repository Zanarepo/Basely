import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def create_fused_white_r_logo():
    # 1. Load model image
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
    
    icon_crop = clean.crop((165, 135, 415, 415))
    text_crop = clean.crop((185, 410, 872, 550))
    
    cw, ch = 800, 560
    
    # Render version where the white 'r' top extension joins smoothly with P base
    comp = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    comp.paste(icon_crop, (50, 40), icon_crop)
    
    # Paste white text positioned so 'r' top edge touches and fuses with P stem base
    comp.paste(text_crop, (47, 302), text_crop)
    
    # Fill the small join gap between P stem and white 'r' stem with white fill so they look 100% unified as one piece!
    join_draw = ImageDraw.Draw(comp)
    # Stem join rect: x=50..78, y=298..308
    join_draw.rectangle([50, 298, 76, 308], fill=(255, 255, 255, 255))
    
    # Crop tight
    bb = comp.getbbox()
    cropped = comp.crop(bb)
    pad = 40
    padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    padded.save('public/prazaner_v4_unified_fused_transparent.png')
    
    # Save Dark Presentation
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
    dark.save('public/prazaner_v4_unified_fused_dark.png')

    print("Unified fused white 'r' logo generated!")

create_fused_white_r_logo()
