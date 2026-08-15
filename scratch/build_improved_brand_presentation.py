import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def build_brand_presentation():
    # Load model image
    img = Image.open('public/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    
    # 1. Cleanly isolate logo content from checkerboard background
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
    
    # Crop exact stacked layout content (Icon top left + razaner text below)
    # Icon: x=165..415, y=135..415
    # Text: x=185..872, y=410..550 (stop before artifact line at 874)
    icon_crop = clean.crop((165, 135, 415, 415))
    text_crop = clean.crop((185, 410, 872, 550))
    
    # Construct exact stacked layout from image copy 3.png
    canvas_w, canvas_h = 750, 500
    stacked = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    stacked.paste(icon_crop, (40, 20), icon_crop)
    stacked.paste(text_crop, (40, 310), text_crop)
    
    bbox = stacked.getbbox()
    logo_content = stacked.crop(bbox)
    
    # Target presentation dimensions: 1200 x 800 (high-res 3:2 canvas)
    target_w, target_h = 1200, 800
    
    # Scale logo content nicely to fit center of presentation canvas
    scale = 1.35
    logo_w = int(logo_content.width * scale)
    logo_h = int(logo_content.height * scale)
    logo_scaled = logo_content.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    pos_x = (target_w - logo_w) // 2 - 20
    pos_y = (target_h - logo_h) // 2
    
    # --- BRANDING PRESENTATION 1: Sleek Dark Mode with Violet Ambient Aura ---
    dark_bg = Image.new('RGBA', (target_w, target_h), (2, 6, 23, 255)) # #020617
    
    # Draw radial gradient violet/indigo ambient aura glow behind the logo
    aura = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    aura_draw = ImageDraw.Draw(aura)
    cx, cy = target_w // 2, target_h // 2
    
    for radius in range(400, 0, -5):
        alpha = int(45 * (1.0 - radius / 400.0) ** 1.8)
        # Violet glow (#7c3aed)
        aura_draw.ellipse([cx - radius*1.2, cy - radius*0.8, cx + radius*1.2, cy + radius*0.8], fill=(124, 58, 237, alpha))
        
    for radius in range(250, 0, -4):
        alpha = int(35 * (1.0 - radius / 250.0) ** 1.5)
        # Indigo core (#4f46e5)
        aura_draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(79, 70, 229, alpha))
        
    aura = aura.filter(ImageFilter.GaussianBlur(radius=30))
    dark_bg.paste(aura, (0, 0), aura)
    
    # Add subtle soft shadow behind logo content
    shadow_mask = logo_scaled.split()[3].filter(ImageFilter.GaussianBlur(radius=12))
    shadow_img = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    shadow_img.paste((0, 0, 0, 180), (pos_x, pos_y + 8), shadow_mask)
    dark_bg.paste(shadow_img, (0, 0), shadow_img)
    
    # Paste main logo content
    dark_bg.paste(logo_scaled, (pos_x, pos_y), logo_scaled)
    
    # Save dark brand presentation
    dark_bg.save('public/prazaner_logo_dark.png')
    dark_bg.save('public/prazaner_logo_preview2.png')
    dark_bg.save('public/prazaner_logo_FINAL.png')

    # --- BRANDING PRESENTATION 2: Clean Studio White Background ---
    white_bg = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 255))
    
    # Soft drop shadow for white background
    w_shadow = logo_scaled.split()[3].filter(ImageFilter.GaussianBlur(radius=8))
    white_bg.paste((15, 23, 42, 140), (pos_x, pos_y + 4), w_shadow)
    white_bg.paste(logo_scaled, (pos_x, pos_y), logo_scaled)
    
    white_bg.save('public/prazaner_logo_white_bg.png')
    white_bg.save('public/prazaner_logo.png')

    # --- BRANDING PRESENTATION 3: Transparent RGBA ---
    transparent_bg = Image.new('RGBA', (logo_w + 80, logo_h + 80), (0, 0, 0, 0))
    transparent_bg.paste(logo_scaled, (40, 40), logo_scaled)
    transparent_bg.save('public/prazaner_logo_transparent.png')

    print("Successfully built improved brand presentation logos!")

build_brand_presentation()
