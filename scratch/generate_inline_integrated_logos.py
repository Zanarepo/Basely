import numpy as np
from PIL import Image, ImageFilter

def build_inline_integrated_logos():
    # 1. Load image copy 3.png and clean RGBA alpha mask
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
    new_data[is_white_text, 0:3] = 255 # Solid pure white text
    
    clean = Image.fromarray(new_data, mode='RGBA')
    
    # 2. Crop 3D Icon mark and "razaner" wordmark
    icon_crop = clean.crop((165, 135, 415, 415))
    text_razaner = clean.crop((185, 410, 873, 550))
    
    # Also create "azaner" text crop by cropping past the first 'r' letter (~x=300 in text_razaner coordinate)
    # Relative to original image x: first 'r' is x=185..285, 'a' starts around 285
    text_azaner = clean.crop((285, 410, 873, 550))
    
    # 3. Create Horizontal Inline Integrated Logo (P Icon + razaner on SAME LINE)
    # Match height of text and icon so P icon sits right next to r/razaner seamlessly
    target_h = 160
    scale_i = target_h / icon_crop.height
    icon_inline = icon_crop.resize((int(icon_crop.width * scale_i), target_h), Image.Resampling.LANCZOS)
    
    # Scale text so its cap height / size aligns perfectly with P mark
    scale_t = (target_h * 0.72) / text_razaner.height
    text_inline_razaner = text_razaner.resize((int(text_razaner.width * scale_t), int(text_razaner.height * scale_t)), Image.Resampling.LANCZOS)
    
    scale_t_az = (target_h * 0.72) / text_azaner.height
    text_inline_azaner = text_azaner.resize((int(text_azaner.width * scale_t_az), int(text_azaner.height * scale_t_az)), Image.Resampling.LANCZOS)
    
    def create_inline_canvas(icon, text, spacing=6, pad=30):
        total_w = icon.width + text.width + spacing + pad * 2
        total_h = max(icon.height, text.height) + pad * 2
        
        comp = Image.new('RGBA', (total_w, total_h), (0, 0, 0, 0))
        # Paste icon at left
        comp.paste(icon, (pad, pad), icon)
        
        # Paste text aligned along baseline (bottom of icon and text align smoothly)
        text_y = pad + (icon.height - text.height) - 4
        comp.paste(text, (pad + icon.width + spacing, text_y), text)
        return comp

    # Variation 1: P Icon + razaner (Tightly spaced so 'r' sits right next to P as an extension)
    inline_v1_tight = create_inline_canvas(icon_inline, text_inline_razaner, spacing=-12) # -12 overlap so r touches P leg!
    inline_v1_seamless = create_inline_canvas(icon_inline, text_inline_razaner, spacing=4)
    inline_v2_azaner = create_inline_canvas(icon_inline, text_inline_azaner, spacing=8)
    
    # Save transparent PNGs
    inline_v1_tight.save('public/prazaner_logo_transparent.png')
    inline_v1_tight.save('public/prazaner_logo_inline_tight.png')
    inline_v1_seamless.save('public/prazaner_logo_inline_seamless.png')
    inline_v2_azaner.save('public/prazaner_logo_inline_azaner.png')
    
    # Save Dark BG (#020617) versions
    def save_dark(img_rgba, path):
        bg = Image.new('RGBA', img_rgba.size, (2, 6, 23, 255))
        bg.paste(img_rgba, (0, 0), img_rgba)
        bg.save(path)
        
    save_dark(inline_v1_tight, 'public/prazaner_logo_dark.png')
    save_dark(inline_v1_tight, 'public/prazaner_logo_preview2.png')
    save_dark(inline_v1_tight, 'public/prazaner_logo_FINAL.png')

    # Save White BG (#ffffff) versions
    def save_white(img_rgba, path):
        bg = Image.new('RGBA', img_rgba.size, (255, 255, 255, 255))
        shadow = img_rgba.split()[3].filter(ImageFilter.GaussianBlur(radius=2))
        bg.paste((15, 23, 42, 170), (0, 2), shadow)
        bg.paste(img_rgba, (0, 0), img_rgba)
        bg.save(path)

    save_white(inline_v1_tight, 'public/prazaner_logo_white_bg.png')
    save_white(inline_v1_tight, 'public/prazaner_logo.png')

    # Save Navbar logo
    save_dark(inline_v1_seamless, 'public/prazaner_logo_navbar.png')
    
    print("Inline integrated logos generated successfully!")

build_inline_integrated_logos()
