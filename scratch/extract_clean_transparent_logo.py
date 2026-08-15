import numpy as np
from PIL import Image, ImageFilter

def process_model_logo():
    # Load model image
    img = Image.open('public/image copy 3.png').convert('RGBA')
    data = np.array(img)
    
    r = data[:, :, 0].astype(float)
    g = data[:, :, 1].astype(float)
    b = data[:, :, 2].astype(float)
    a = data[:, :, 3].astype(float)
    
    # Identify background checkerboard pixels:
    # Checkerboard is neutral gray where |R-G| < 15 and |G-B| < 15 and max(R,G,B) < 120
    is_gray = (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (r < 120)
    
    # Text is bright white (R > 180, G > 180, B > 180)
    is_white_text = (r > 180) & (g > 180) & (b > 180)
    
    # Icon is purple/indigo (B > G + 15 or R > G + 15)
    is_purple_icon = (b > g + 10) | (r > g + 10)
    
    # Create new alpha channel
    new_a = np.zeros_like(a)
    
    # Keep text pixels as solid 255 alpha
    new_a[is_white_text] = 255
    
    # Keep icon pixels as solid 255 alpha
    new_a[is_purple_icon] = 255
    
    # Anti-aliasing fringe handling:
    # For transition pixels (where it's not purely gray but not fully white/purple), calculate alpha based on color intensity
    transition = ~is_gray & ~is_white_text & ~is_purple_icon
    # Calculate saturation / brightness for smooth edge alpha
    brightness = (r + g + b) / 3.0
    color_diff = np.maximum(np.abs(r - g), np.abs(b - g))
    edge_alpha = np.clip((color_diff * 4 + (brightness - 50) * 2), 0, 255)
    new_a[transition] = edge_alpha[transition]
    
    # For white text pixels, make RGB pure white (255, 255, 255)
    new_data = data.copy()
    new_data[:, :, 3] = new_a
    
    # Where it's white text, set color to pure (255, 255, 255)
    new_data[is_white_text, 0] = 255
    new_data[is_white_text, 1] = 255
    new_data[is_white_text, 2] = 255
    
    clean_logo = Image.fromarray(new_data, mode='RGBA')
    
    # Crop to content bounding box
    bbox = clean_logo.getbbox()
    if bbox:
        cropped_logo = clean_logo.crop(bbox)
        # Add a nice padding around
        padding = 30
        padded_w = cropped_logo.width + padding * 2
        padded_h = cropped_logo.height + padding * 2
        
        # 1. Transparent version (RGBA)
        final_transparent = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
        final_transparent.paste(cropped_logo, (padding, padding), cropped_logo)
        final_transparent.save('public/prazaner_logo_transparent.png')
        
        # 2. Dark Mode background (#020617 - Tailwind slate-950)
        final_dark = Image.new('RGBA', (padded_w, padded_h), (2, 6, 23, 255))
        final_dark.paste(cropped_logo, (padding, padding), cropped_logo)
        final_dark.save('public/prazaner_logo_dark.png')
        final_dark.save('public/prazaner_logo_preview2.png')
        final_dark.save('public/prazaner_logo_FINAL.png')

        # 3. Pure White background (#ffffff) with subtle dark outline on white text so it pops on white bg
        final_white = Image.new('RGBA', (padded_w, padded_h), (255, 255, 255, 255))
        
        # For white background version, white text needs a subtle dark drop shadow / outline to be legible
        # Create subtle text drop shadow for white bg
        shadow_mask = Image.new('L', (padded_w, padded_h), 0)
        shadow_draw = Image.new('RGBA', (padded_w, padded_h), (0, 0, 0, 0))
        # Draw dark outline behind text on white bg
        # Let's paste logo onto white bg with a soft dark glow behind white text
        shadow = cropped_logo.split()[3].filter(ImageFilter.GaussianBlur(radius=3))
        final_white.paste((15, 23, 42, 180), (padding, padding+2), shadow)
        final_white.paste(cropped_logo, (padding, padding), cropped_logo)
        final_white.save('public/prazaner_logo_white_bg.png')
        final_white.save('public/prazaner_logo.png')

        # 4. Navbar logo (horizontal layout)
        # Create horizontal version: Icon on left, text on right!
        # Slice icon and text from cropped_logo
        # Icon top region, text bottom region
        icon_h = int(cropped_logo.height * 0.65)
        icon_only = cropped_logo.crop((0, 0, int(cropped_logo.width * 0.45), icon_h))
        text_only = cropped_logo.crop((0, int(cropped_logo.height * 0.58), cropped_logo.width, cropped_logo.height))
        
        # Navbar horizontal dimensions: h = 80, scale icon and text
        nav_h = 70
        scale_i = nav_h / icon_only.height
        icon_nav = icon_only.resize((int(icon_only.width * scale_i), nav_h), Image.Resampling.LANCZOS)
        
        scale_t = (nav_h * 0.62) / text_only.height
        text_nav = text_only.resize((int(text_only.width * scale_t), int(text_only.height * scale_t)), Image.Resampling.LANCZOS)
        
        nav_w = icon_nav.width + text_nav.width + 20
        navbar_logo = Image.new('RGBA', (nav_w + 20, nav_h + 10), (0, 0, 0, 0))
        navbar_logo.paste(icon_nav, (10, 5), icon_nav)
        navbar_logo.paste(text_nav, (10 + icon_nav.width + 12, 5 + int(nav_h*0.25)), text_nav)
        
        navbar_logo.save('public/prazaner_logo_navbar.png')
        navbar_logo.save('public/parzana_logo_navbar.png')
        
        print("Successfully generated all logo files from model image!")

process_model_logo()
