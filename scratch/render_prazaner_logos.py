import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

def draw_antialiased_logo(scale=4, version=1, word="razaner", icon_style="pr_monogram"):
    """
    Renders a high-resolution logo image and downsamples it for crisp antialiasing.
    Target size: 1008 x 698 (downsampled to 504 x 349 to match parzana_logo.png canvas).
    """
    base_w, base_h = 504, 349
    w, h = base_w * scale, base_h * scale
    
    # 1. Background: Pure White
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Create linear gradient for the icon
    # Gradient from #8b5cf6 (violet) -> #7c3aed -> #4f46e5 (indigo)
    gradient = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(gradient)
    c_start = (139, 92, 246) # Violet
    c_end = (79, 70, 229)    # Indigo
    
    for y_idx in range(h):
        t = y_idx / h
        r = int(c_start[0] * (1 - t) + c_end[0] * t)
        g = int(c_start[1] * (1 - t) + c_end[1] * t)
        b = int(c_start[2] * (1 - t) + c_end[2] * t)
        g_draw.line([(0, y_idx), (w, y_idx)], fill=(r, g, b, 255))
        
    # Mask for icon path
    icon_mask = Image.new("L", (w, h), 0)
    m_draw = ImageDraw.Draw(icon_mask)
    
    # Coordinates scaled
    # Base icon pos: x=20..220, y=15..215 in 504x349 space
    sw = 14 * scale # Stroke width
    
    if icon_style == "parzana_exact_p_r":
        # Matching parzana_logo icon shape, where outer loop is P and inner leg is r
        # Draw outer loop path as thick lines/arcs
        # Left stem: x=35..35+sw, y=25..205
        # Outer P top curve, right arc, bottom arc back to stem
        # Inner leg: x=75..75+sw, y=160..205
        
        # We draw onto icon_mask using polygon/line commands with rounding
        # Top outer loop of P:
        # Left main stem (P stem): (40*scale, 20*scale) to (40*scale, 210*scale)
        # Inner r leg: (80*scale, 155*scale) to (80*scale, 210*scale)
        
        # Outer boundary of P
        px = 35 * scale
        py = 20 * scale
        pw = 150 * scale
        ph = 140 * scale
        
        # Draw outer loop (rounded rect / arc for P head)
        # Top bar + curve + bottom return
        m_draw.rounded_rectangle([px, py, px + pw, py + ph], radius=50*scale, outline=255, width=sw)
        # Inner cutout to make hollow P eye
        m_draw.rounded_rectangle([px + sw + 12*scale, py + sw + 10*scale, px + pw - sw - 12*scale, py + ph - sw - 10*scale], radius=30*scale, fill=0)

        # Clear lower-left of P loop to connect stem smoothly
        m_draw.rectangle([px, py + ph - sw, px + sw + 15*scale, py + ph + 2], fill=255)

        # Main P stem going down
        m_draw.rounded_rectangle([px, py + ph - 10*scale, px + sw, py + 195*scale], radius=sw//2, fill=255)
        
        # Secondary 'r' leg going down next to main stem
        rx = px + sw + 18 * scale
        m_draw.rounded_rectangle([rx, py + ph + 15*scale, rx + sw, py + 195*scale], radius=sw//2, fill=255)
        
    elif icon_style == "pr_integrated_arch":
        # Enhanced P+r Monogram where right stem arches out explicitly like an 'r'
        px = 35 * scale
        py = 20 * scale
        pw = 150 * scale
        ph = 135 * scale
        
        # Outer P loop
        m_draw.rounded_rectangle([px, py, px + pw, py + ph], radius=55*scale, outline=255, width=sw)
        # Inner P eye cutout
        m_draw.rounded_rectangle([px + sw + 14*scale, py + sw + 12*scale, px + pw - sw - 14*scale, py + ph - sw - 12*scale], radius=32*scale, fill=0)

        # Main P stem
        m_draw.rounded_rectangle([px, py + ph - 15*scale, px + sw, py + 195*scale], radius=sw//2, fill=255)
        
        # 'r' leg branching out from P stem with smooth arc top
        rx = px + sw + 16 * scale
        ry = py + ph + 5 * scale
        # Vertical leg of r
        m_draw.rounded_rectangle([rx, ry, rx + sw, py + 195*scale], radius=sw//2, fill=255)
        # Top arch connecting to P loop bottom
        m_draw.rectangle([px + sw - 2, py + ph - sw, rx + sw + 2, py + ph + 10*scale], fill=255)

    # Composite gradient onto image using icon_mask
    img.paste(gradient, (0, 0), icon_mask)
    
    # 2. Draw Wordmark Text below
    # Font: Modern rounded white text with dark outline on white background
    # Let's try loading installed fonts or fallback default bold font with custom outline rendering
    try:
        # Try common modern fonts on Windows
        font_path = "C:/Windows/Fonts/arialbd.ttf"
        font = ImageFont.truetype(font_path, 72 * scale)
    except:
        font = ImageFont.load_default()
        
    text_x = 20 * scale
    text_y = 230 * scale
    
    # Draw text with white fill and dark slate outline
    outline_color = (30, 41, 59, 255) # Dark slate #1e293b
    text_color = (255, 255, 255, 255) # Pure White
    
    # Outline offset thickness
    o_size = int(2.2 * scale)
    
    txt_draw = ImageDraw.Draw(img)
    
    # Draw stroke outline by offsetting around text
    for dx in range(-o_size, o_size + 1):
        for dy in range(-o_size, o_size + 1):
            if dx*dx + dy*dy <= o_size*o_size + 1:
                txt_draw.text((text_x + dx, text_y + dy), word, font=font, fill=outline_color)
                
    # Draw white text interior
    txt_draw.text((text_x, text_y), word, font=font, fill=text_color)
    
    # Downsample for ultra high quality antialiasing
    final_img = img.resize((base_w, base_h), Image.Resampling.LANCZOS)
    return final_img

# Generate test variations
v1 = draw_antialiased_logo(scale=4, word="razaner", icon_style="parzana_exact_p_r")
v1.save("public/prazaner_logo_v1.png")

v2 = draw_antialiased_logo(scale=4, word="azaner", icon_style="parzana_exact_p_r")
v2.save("public/prazaner_logo_v2.png")

v3 = draw_antialiased_logo(scale=4, word="Prazaner", icon_style="pr_integrated_arch")
v3.save("public/prazaner_logo_v3.png")

print("Generated v1, v2, v3 successfully!")
