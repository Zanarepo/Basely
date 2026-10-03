import numpy as np
from PIL import Image, ImageFilter

def build_flawless_navbar_logo():
    # 1. Load model image copy 3.png
    img = Image.open('public/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    
    # Isolate checkerboard background vs logo content
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
    new_data[is_white_text, 0:3] = 255 # Solid pure white text (#ffffff)
    
    clean = Image.fromarray(new_data, mode='RGBA')
    
    # 2. Extract Icon crop & Text crop
    icon_crop = clean.crop((165, 135, 415, 415))
    text_crop = clean.crop((185, 410, 872, 550))
    
    icon_tight = icon_crop.crop(icon_crop.getbbox())
    text_tight = text_crop.crop(text_crop.getbbox())
    
    # 3. Create Horizontal Navbar Layout: Icon on left + razaner text on right
    # Target height: 100px (high res downsampled to h=40 in CSS)
    nav_h = 100
    scale_icon = nav_h / icon_tight.height
    icon_nav = icon_tight.resize((int(icon_tight.width * scale_icon), nav_h), Image.Resampling.LANCZOS)
    
    scale_text = (nav_h * 0.65) / text_tight.height
    text_nav = text_tight.resize((int(text_tight.width * scale_text), int(text_tight.height * scale_text)), Image.Resampling.LANCZOS)
    
    spacing = 16
    pad = 12
    total_w = icon_nav.width + text_nav.width + spacing + pad * 2
    total_h = nav_h + pad * 2
    
    # --- Format 1: Pure 100% Transparent RGBA (Blends flawlessly into any navbar background color!) ---
    nav_transparent = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
    nav_transparent.paste(icon_nav, (pad, pad), icon_nav)
    
    text_y_pos = pad + int((nav_h - text_nav.height) / 2) + 2
    nav_transparent.paste(text_nav, (pad + icon_nav.width + spacing, text_y_pos), text_nav)
    
    nav_transparent.save('public/prazaner_logo_navbar.png')
    nav_transparent.save('public/parzana_logo_navbar.png')
    
    # --- Format 2: Matching Slate-950 (#020617) Landing Page Background ---
    nav_slate = Image.new('RGBA', (total_w, total_h), (2, 6, 23, 255)) # #020617
    nav_slate.paste(nav_transparent, (0, 0), nav_transparent)
    nav_slate.save('public/prazaner_logo_navbar_slate.png')
    
    # --- Format 3: Stacked Version Matching Slate-950 (#020617) Landing Page ---
    stacked_h = 240
    s_scale_i = (stacked_h * 0.6) / icon_tight.height
    s_icon = icon_tight.resize((int(icon_tight.width * s_scale_i), int(stacked_h * 0.6)), Image.Resampling.LANCZOS)
    
    s_scale_t = (stacked_h * 0.35) / text_tight.height
    s_text = text_tight.resize((int(text_tight.width * s_scale_t), int(text_tight.height * s_scale_t)), Image.Resampling.LANCZOS)
    
    s_w = max(s_icon.width, s_text.width) + 60
    s_canvas_h = s_icon.height + s_text.height + 40
    
    s_transparent = Image.new('RGBA', (s_w, s_canvas_h), (0, 0, 0, 0))
    s_transparent.paste(s_icon, (30, 20), s_icon)
    s_transparent.paste(s_text, (30, 20 + s_icon.height + 6), s_text)
    
    s_transparent.save('public/prazaner_logo_transparent.png')
    
    # Dark mode slate-950 background
    s_dark = Image.new('RGBA', (s_w + 40, s_canvas_h + 40), (2, 6, 23, 255))
    s_dark.paste(s_transparent, (20, 20), s_transparent)
    s_dark.save('public/prazaner_logo_dark.png')
    s_dark.save('public/prazaner_logo_preview2.png')

    print("Flawless navbar logos matching landing page background created successfully!")

build_flawless_navbar_logo()
