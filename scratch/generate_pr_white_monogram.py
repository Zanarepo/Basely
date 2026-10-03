import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def create_pr_white_prominent_logo():
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
    
    # Let's create an integrated single horizontal line layout:
    # 3D P Icon on left + Prominent Solid White "r" joined to P + "azaner"
    cw, ch = 900, 300
    comp = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    
    # Scale icon
    icon_scaled = icon_crop.resize((150, 150), Image.Resampling.LANCZOS)
    text_scaled = text_crop.resize((480, 110), Image.Resampling.LANCZOS)
    
    # Paste icon
    comp.paste(icon_scaled, (40, 50), icon_scaled)
    # Paste text seamlessly aligned on the same horizontal line, with white 'r' touching P stem
    comp.paste(text_scaled, (184, 85), text_scaled)
    
    bb = comp.getbbox()
    cropped = comp.crop(bb)
    pad = 40
    padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    padded.save('public/prazaner_v5_inline_white_r_transparent.png')
    
    target_w, target_h = 1000, 500
    dark = Image.new('RGBA', (target_w, target_h), (2, 6, 23, 255))
    
    aura = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    aura_draw = ImageDraw.Draw(aura)
    cx, cy = target_w // 2, target_h // 2
    for radius in range(300, 0, -5):
        alpha = int(40 * (1.0 - radius / 300.0) ** 1.8)
        aura_draw.ellipse([cx - radius*1.5, cy - radius*0.7, cx + radius*1.5, cy + radius*0.7], fill=(124, 58, 237, alpha))
        
    aura = aura.filter(ImageFilter.GaussianBlur(radius=25))
    dark.paste(aura, (0, 0), aura)
    
    pos_x = (target_w - padded.width) // 2
    pos_y = (target_h - padded.height) // 2
    
    shadow_mask = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=10))
    dark.paste((0, 0, 0, 160), (pos_x, pos_y + 6), shadow_mask)
    dark.paste(padded, (pos_x, pos_y), padded)
    dark.save('public/prazaner_v5_inline_white_r_dark.png')

create_pr_white_prominent_logo()
