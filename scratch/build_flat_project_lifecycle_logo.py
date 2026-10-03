import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def draw_flat_project_lifecycle_logo(scale=4):
    """
    Renders a flat vector Prazaner logo with the EXACT color gradient 
    from 'project lifecycle.' (violet-400 #a78bfa to indigo-400 #818cf8),
    with NO metallic sheen, NO iron texture, and NO shiny reflections.
    """
    base_w, base_h = 600, 360
    w, h = base_w * scale, base_h * scale
    
    # 1. Canvas RGBA
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Gradient: violet-400 (#a78bfa) -> indigo-400 (#818cf8)
    gradient = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    c1 = (167, 139, 250) # #a78bfa (violet-400)
    c2 = (129, 140, 248) # #818cf8 (indigo-400)
    
    for y_idx in range(h):
        t = y_idx / h
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        g_draw.line([(0, y_idx), (w, y_idx)], fill=(r, g, b, 255))
        
    # Mask for Icon Mark
    icon_mask = Image.new("L", (w, h), 0)
    m_draw = ImageDraw.Draw(icon_mask)
    
    # Draw P+r Monogram Mark geometry matching image copy 3 layout
    # Base icon pos: x=50, y=30
    px = 50 * scale
    py = 30 * scale
    pw = 150 * scale
    ph = 140 * scale
    sw = 16 * scale # Stroke width
    
    # Outer P loop
    m_draw.rounded_rectangle([px, py, px + pw, py + ph], radius=52*scale, outline=255, width=sw)
    # Inner P eye cutout
    m_draw.rounded_rectangle([px + sw + 12*scale, py + sw + 10*scale, px + pw - sw - 12*scale, py + ph - sw - 10*scale], radius=32*scale, fill=0)

    # Main P stem (Leg 1) going straight down
    m_draw.rounded_rectangle([px, py + ph - 15*scale, px + sw, py + 205*scale], radius=sw//2, fill=255)
    
    # Secondary inner leg (Leg 2) going down
    rx = px + sw + 16 * scale
    m_draw.rounded_rectangle([rx, py + ph + 12*scale, rx + sw, py + 205*scale], radius=sw//2, fill=255)

    # Composite flat gradient onto icon mask
    img.paste(gradient, (0, 0), icon_mask)
    
    # 2. Draw Solid White Text below
    # The left stem of white 'r' matches Leg 1 base of P 100% perfectly!
    try:
        font_path = "C:/Windows/Fonts/arialbd.ttf"
        font = ImageFont.truetype(font_path, 80 * scale)
    except:
        font = ImageFont.load_default()
        
    text_x = px # Left edge of text starts at leg 1 left edge (px)
    text_y = py + 200 * scale # White 'r' top meets Leg 1 base with zero separation!
    
    txt_draw = ImageDraw.Draw(img)
    txt_draw.text((text_x, text_y), "razaner", font=font, fill=(255, 255, 255, 255))
    
    # 3. Crop tight and create final output formats
    bbox = img.getbbox()
    cropped = img.crop(bbox)
    
    pad = 30 * scale
    padded = Image.new("RGBA", (cropped.width + pad*2, cropped.height + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad), cropped)
    
    final_transparent = padded.resize((padded.width // scale, padded.height // scale), Image.Resampling.LANCZOS)
    final_transparent.save("public/prazaner_logo_flat_lifecycle_transparent.png")
    final_transparent.save("public/prazaner_logo_transparent.png")
    
    # Navbar logo (Horizontal layout with flat violet-400/indigo-400 icon + white text)
    nav_h = 100 * scale
    scale_icon = nav_h / (205 * scale)
    icon_nav_mask = Image.new("L", (w, h), 0)
    in_draw = ImageDraw.Draw(icon_nav_mask)
    
    # Draw scaled icon mark for navbar
    n_px, n_py = 20 * scale, 10 * scale
    n_pw, n_ph = 85 * scale, 80 * scale
    n_sw = 9 * scale
    
    in_draw.rounded_rectangle([n_px, n_py, n_px + n_pw, n_py + n_ph], radius=30*scale, outline=255, width=n_sw)
    in_draw.rounded_rectangle([n_px + n_sw + 7*scale, n_py + n_sw + 6*scale, n_px + n_pw - n_sw - 7*scale, n_py + n_ph - n_sw - 6*scale], radius=18*scale, fill=0)
    in_draw.rounded_rectangle([n_px, n_py + n_ph - 8*scale, n_px + n_sw, n_py + 115*scale], radius=n_sw//2, fill=255)
    in_draw.rounded_rectangle([n_px + n_sw + 9*scale, n_py + n_ph + 6*scale, n_px + n_sw + 9*scale + n_sw, n_py + 115*scale], radius=n_sw//2, fill=255)
    
    nav_icon_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    nav_icon_img.paste(gradient, (0, 0), icon_nav_mask)
    nav_icon_crop = nav_icon_img.crop(nav_icon_img.getbbox())
    
    # Render text for navbar
    nav_font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 64 * scale)
    text_nav_img = Image.new("RGBA", (600 * scale, 120 * scale), (0, 0, 0, 0))
    tn_draw = ImageDraw.Draw(text_nav_img)
    tn_draw.text((0, 0), "razaner", font=nav_font, fill=(255, 255, 255, 255))
    text_nav_crop = text_nav_img.crop(text_nav_img.getbbox())
    
    nav_comp = Image.new("RGBA", (nav_icon_crop.width + text_nav_crop.width + 40*scale, nav_h + 30*scale), (0, 0, 0, 0))
    nav_comp.paste(nav_icon_crop, (15*scale, 10*scale), nav_icon_crop)
    
    text_nav_y = 10*scale + (nav_icon_crop.height - text_nav_crop.height) // 2 + 4*scale
    nav_comp.paste(text_nav_crop, (15*scale + nav_icon_crop.width + 16*scale, text_nav_y), text_nav_crop)
    
    nav_final = nav_comp.resize((nav_comp.width // scale, nav_comp.height // scale), Image.Resampling.LANCZOS)
    nav_final.save("public/prazaner_logo_navbar.png")
    nav_final.save("public/parzana_logo_navbar.png")
    nav_final.save("public/logo/Mainlogotransparent.png")
    
    # Presentation in Dark Mode slate-950 (#020617)
    target_w, target_h = 1000, 700
    dark = Image.new("RGBA", (target_w, target_h), (2, 6, 23, 255))
    
    aura = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    aura_draw = ImageDraw.Draw(aura)
    cx, cy = target_w // 2, target_h // 2
    for radius in range(350, 0, -5):
        alpha = int(40 * (1.0 - radius / 350.0) ** 1.8)
        aura_draw.ellipse([cx - radius*1.2, cy - radius*0.8, cx + radius*1.2, cy + radius*0.8], fill=(124, 58, 237, alpha))
        
    aura = aura.filter(ImageFilter.GaussianBlur(radius=25))
    dark.paste(aura, (0, 0), aura)
    
    pos_x = (target_w - final_transparent.width) // 2
    pos_y = (target_h - final_transparent.height) // 2
    
    shadow_mask = final_transparent.split()[3].filter(ImageFilter.GaussianBlur(radius=10))
    dark.paste((0, 0, 0, 160), (pos_x, pos_y + 6), shadow_mask)
    dark.paste(final_transparent, (pos_x, pos_y), final_transparent)
    
    dark.save("public/prazaner_logo_flat_lifecycle_dark.png")
    dark.save("public/prazaner_logo_dark.png")
    dark.save("public/prazaner_logo_preview2.png")

    print("Flat project lifecycle gradient logos generated successfully!")

draw_flat_project_lifecycle_logo()
