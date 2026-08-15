import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def create_aligned_and_joined_logos():
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
    new_data[is_white_text, 0:3] = 255 # Pure white text
    
    clean = Image.fromarray(new_data, mode='RGBA')
    
    # 2. Extract 3D Icon mark and "razaner" wordmark
    # Icon bounds: x=165..415, y=135..415
    # Text bounds: x=185..872, y=410..550
    icon_crop = clean.crop((165, 135, 415, 415))
    text_crop = clean.crop((185, 410, 872, 550))
    
    # Let's measure left stem X position in icon_crop vs text_crop:
    # In icon_crop, the left stem is around x=0..35 in local crop coords
    # In text_crop, the 'r' left stem is around x=0..25 in local crop coords
    
    # Target canvas size
    cw, ch = 800, 560
    
    # -------------------------------------------------------------
    # VARIATION 1: PERFECT VERTICAL ALIGNMENT (P stem & white 'r' stem aligned)
    # -------------------------------------------------------------
    v1 = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    # Icon pos: (50, 40)
    v1.paste(icon_crop, (50, 40), icon_crop)
    # Shift text slightly right so white 'r' stem aligns 100% with P main left stem
    # P main stem starts at x=50. White 'r' stem in text_crop starts at +3px, so x=47
    v1.paste(text_crop, (47, 320), text_crop)
    
    # -------------------------------------------------------------
    # VARIATION 2: JOINED / CONNECTED (P stem and white 'r' connected into ONE item)
    # -------------------------------------------------------------
    v2 = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    v2.paste(icon_crop, (50, 40), icon_crop)
    # Move text UP so the top of white 'r' stem touches the bottom tip of P stem smoothly
    v2.paste(text_crop, (47, 305), text_crop) # y=305 creates direct connection!
    
    # -------------------------------------------------------------
    # VARIATION 3: SEAMLESS INTEGRATED ONE-PIECE (P & White R Overlapped & Flowing)
    # -------------------------------------------------------------
    v3 = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    v3.paste(icon_crop, (50, 40), icon_crop)
    # Move text y=298 so the white 'r' stem overlaps and fuses with the P stem base
    v3.paste(text_crop, (47, 298), text_crop)
    
    # Save all variations in Dark Slate (#020617), White (#ffffff), and Transparent RGBA
    def save_all_formats(comp_img, prefix):
        # Crop tight
        bb = comp_img.getbbox()
        cropped = comp_img.crop(bb)
        pad = 40
        padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
        padded.paste(cropped, (pad, pad), cropped)
        
        # Transparent
        padded.save(f'public/{prefix}_transparent.png')
        
        # Dark slate with soft ambient violet glow
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
        dark.save(f'public/{prefix}_dark.png')
        
        # White background
        white = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 255))
        w_shadow = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=6))
        white.paste((15, 23, 42, 140), (pos_x, pos_y + 4), w_shadow)
        white.paste(padded, (pos_x, pos_y), padded)
        white.save(f'public/{prefix}_white.png')

    save_all_formats(v1, 'prazaner_v1_perfect_aligned')
    save_all_formats(v2, 'prazaner_v2_joined_connected')
    save_all_formats(v3, 'prazaner_v3_seamless_fused')

    # Also update default prazaner_logo_dark.png with the joined option (v2)
    save_all_formats(v2, 'prazaner_logo')
    save_all_formats(v2, 'prazaner_logo_preview2')

    print("All aligned and joined logo variations created successfully!")

create_aligned_and_joined_logos()
