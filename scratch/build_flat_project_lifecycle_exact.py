import numpy as np
from PIL import Image, ImageFilter, ImageDraw

def build_flat_exact_icon_logo():
    # 1. Load model image copy 3.png from public/logo/
    img = Image.open('public/logo/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    
    is_gray = (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (r < 120)
    is_white_text = (r > 180) & (g > 180) & (b > 180)
    is_purple_icon = (b > g + 10) | (r > g + 10)
    
    # Isolate exact icon shape alpha mask
    icon_alpha_mask = np.zeros_like(r, dtype=np.uint8)
    icon_alpha_mask[is_purple_icon] = 255
    
    # Smooth edges
    transition = ~is_gray & ~is_white_text & ~is_purple_icon
    brightness = (r + g + b) / 3.0
    color_diff = np.maximum(np.abs(r - g), np.abs(b - g))
    edge_alpha = np.clip((color_diff * 4 + (brightness - 50) * 2), 0, 255).astype(np.uint8)
    icon_alpha_mask[transition] = edge_alpha[transition]
    
    # Create flat gradient layer matching 'project lifecycle.' text exactly:
    # violet-400 (#a78bfa) to indigo-400 (#818cf8)
    h, w = data.shape[:2]
    flat_icon = np.zeros((h, w, 4), dtype=np.uint8)
    
    c_start = np.array([167, 139, 250]) # #a78bfa (violet-400)
    c_end = np.array([129, 140, 248])   # #818cf8 (indigo-400)
    
    # Fill with linear gradient
    for y_idx in range(h):
        t = y_idx / float(h)
        col = (c_start * (1 - t) + c_end * t).astype(np.uint8)
        flat_icon[y_idx, :, 0] = col[0]
        flat_icon[y_idx, :, 1] = col[1]
        flat_icon[y_idx, :, 2] = col[2]
        
    flat_icon[:, :, 3] = icon_alpha_mask
    
    # Create clean white text layer
    text_layer = np.zeros((h, w, 4), dtype=np.uint8)
    text_layer[is_white_text, 0:3] = 255
    text_layer[is_white_text, 3] = 255
    
    icon_img = Image.fromarray(flat_icon, mode='RGBA')
    text_img = Image.fromarray(text_layer, mode='RGBA')
    
    # Crop exact bounds
    icon_crop = icon_img.crop((165, 135, 415, 415))
    text_crop = text_img.crop((185, 410, 872, 550))
    
    icon_tight = icon_crop.crop(icon_crop.getbbox())
    text_tight = text_crop.crop(text_crop.getbbox())
    
    # Align 1st leg of P and white 'r' perfectly with ZERO separation!
    icon_x, icon_y = 80, 50
    text_x = icon_x # Left stem of P leg 1 and top of white 'r' align perfectly at X=80!
    text_y = icon_y + icon_tight.height - 6 # Seamless overlap
    
    comp_w, comp_h = 900, 600
    comp = Image.new('RGBA', (comp_w, comp_h), (0, 0, 0, 0))
    comp.paste(icon_tight, (icon_x, icon_y), icon_tight)
    comp.paste(text_tight, (text_x, text_y), text_tight)
    
    # Tight crop
    final_bbox = comp.getbbox()
    cropped = comp.crop(final_bbox)
    pad = 30
    padded = Image.new('RGBA', (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    # Save Transparent RGBA
    padded.save('public/prazaner_logo_transparent.png')
    padded.save('public/logo/Mainlogotransparent.png')
    
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
    
    dark.save('public/prazaner_logo_dark.png')
    dark.save('public/prazaner_logo_preview2.png')
    dark.save('public/prazaner_logo_FINAL.png')
    dark.save('public/logo/mainlogodark.png')

    # Save White background presentation
    white = Image.new('RGBA', (target_w, target_h), (255, 255, 255, 255))
    w_shadow = padded.split()[3].filter(ImageFilter.GaussianBlur(radius=6))
    white.paste((15, 23, 42, 140), (pos_x, pos_y + 4), w_shadow)
    white.paste(padded, (pos_x, pos_y), padded)
    white.save('public/prazaner_logo_white_bg.png')
    white.save('public/prazaner_logo.png')

    # Save Navbar Logo (Horizontal layout: flat violet/indigo icon + white text)
    nav_h = 75
    scale_i = nav_h / icon_tight.height
    icon_nav = icon_tight.resize((int(icon_tight.width * scale_i), nav_h), Image.Resampling.LANCZOS)
    
    scale_t = (nav_h * 0.65) / text_tight.height
    text_nav = text_tight.resize((int(text_tight.width * scale_t), int(text_tight.height * scale_t)), Image.Resampling.LANCZOS)
    
    nav_comp = Image.new('RGBA', (icon_nav.width + text_nav.width + 30, nav_h + 20), (0, 0, 0, 0))
    nav_comp.paste(icon_nav, (10, 10), icon_nav)
    nav_comp.paste(text_nav, (10 + icon_nav.width + 12, 10 + int((nav_h - text_nav.height)/2)), text_nav)
    
    nav_comp.save('public/prazaner_logo_navbar.png')
    nav_comp.save('public/parzana_logo_navbar.png')

    print("Flat exact icon logo matching 'project lifecycle.' gradient created successfully!")

build_flat_exact_icon_logo()
