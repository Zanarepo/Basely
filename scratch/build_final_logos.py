import os
from PIL import Image, ImageDraw, ImageFont

def build_final_prazaner_logos():
    # Load reference icon from parzana_logo.png
    ref = Image.open('public/parzana_logo.png').convert('RGBA')
    w, h = ref.size # 504, 349
    
    scale = 4
    canvas_w, canvas_h = w * scale, h * scale
    icon_region = ref.crop((0, 0, 240, 240))
    icon_hi = icon_region.resize((240 * scale, 240 * scale), Image.Resampling.LANCZOS)
    
    font_paths = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            font = ImageFont.truetype(fp, 76 * scale)
            break
    if not font:
        font = ImageFont.load_default()
        
    def create_stacked_logo(word, bg_color=(255, 255, 255, 255)):
        canvas = Image.new('RGBA', (canvas_w, canvas_h), bg_color)
        canvas.paste(icon_hi, (12 * scale, 10 * scale), icon_hi)
        draw = ImageDraw.Draw(canvas)
        
        text_x = 18 * scale
        text_y = 236 * scale
        
        outline_color = (30, 41, 59, 255)
        fill_color = (255, 255, 255, 255)
        stroke_w = int(2.2 * scale)
        
        for dx in range(-stroke_w, stroke_w + 1):
            for dy in range(-stroke_w, stroke_w + 1):
                if dx*dx + dy*dy <= stroke_w*stroke_w + 1:
                    draw.text((text_x + dx, text_y + dy), word, font=font, fill=outline_color)
                    
        draw.text((text_x, text_y), word, font=font, fill=fill_color)
        
        final_img = canvas.resize((w, h), Image.Resampling.LANCZOS)
        return final_img

    def create_navbar_logo(word):
        # Navbar horizontal layout (Icon + Text side-by-side)
        nav_w, nav_h = 320 * scale, 80 * scale
        canvas = Image.new('RGBA', (nav_w, nav_h), (0, 0, 0, 0)) # transparent bg for navbar
        
        icon_nav = icon_region.resize((70 * scale, 70 * scale), Image.Resampling.LANCZOS)
        canvas.paste(icon_nav, (5 * scale, 5 * scale), icon_nav)
        
        draw = ImageDraw.Draw(canvas)
        nav_font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 44 * scale)
        
        text_x = 85 * scale
        text_y = 16 * scale
        
        outline_color = (30, 41, 59, 255)
        fill_color = (255, 255, 255, 255)
        stroke_w = int(1.8 * scale)
        
        for dx in range(-stroke_w, stroke_w + 1):
            for dy in range(-stroke_w, stroke_w + 1):
                if dx*dx + dy*dy <= stroke_w*stroke_w + 1:
                    draw.text((text_x + dx, text_y + dy), word, font=nav_font, fill=outline_color)
                    
        draw.text((text_x, text_y), word, font=nav_font, fill=fill_color)
        
        final_img = canvas.resize((320, 80), Image.Resampling.LANCZOS)
        return final_img

    # Main stacked logos on white background
    logo_razaner = create_stacked_logo("razaner")
    logo_razaner.save('public/prazaner_logo.png')
    logo_razaner.save('public/prazaner_logo_preview2.png')

    logo_azaner = create_stacked_logo("azaner")
    logo_azaner.save('public/prazaner_logo_option2_azaner.png')
    
    logo_full = create_stacked_logo("Prazaner")
    logo_full.save('public/prazaner_logo_option3_full.png')
    
    # Navbar logos
    nav_logo = create_navbar_logo("razaner")
    nav_logo.save('public/prazaner_logo_navbar.png')

    print("Successfully built and saved all logo assets!")

build_final_prazaner_logos()
