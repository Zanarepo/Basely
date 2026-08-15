import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def extract_and_build_logos():
    # 1. Load reference image parzana_logo.png
    ref = Image.open('public/parzana_logo.png').convert('RGBA')
    w, h = ref.size # 504, 349
    
    # 2. Crop exact icon mark from parzana_logo.png
    # The icon mark is in top-left region (x: 10..220, y: 10..240)
    # Let's find exact icon bounding box by background color thresholding (white bg = 255)
    bg = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    
    # Crop icon region (0, 0, 240, 240)
    icon_region = ref.crop((0, 0, 240, 240))
    
    # Let's create high-res composite logo variations (1008 x 698 downsampled to 504 x 349)
    scale = 4
    canvas_w, canvas_h = 504 * scale, 349 * scale
    
    # Upscale icon region for high-res compositing
    icon_hi = icon_region.resize((240 * scale, 240 * scale), Image.Resampling.LANCZOS)
    
    def render_logo(word_text, filename):
        canvas = Image.new('RGBA', (canvas_w, canvas_h), (255, 255, 255, 255))
        
        # Paste icon at top left position (matching parzana_logo.png layout)
        # Position: x = 12 * scale, y = 10 * scale
        canvas.paste(icon_hi, (12 * scale, 10 * scale), icon_hi)
        
        draw = ImageDraw.Draw(canvas)
        
        # Font configuration
        # Try loading Arial Rounded or modern sans font
        font_size = 76 * scale
        font = None
        font_paths = [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/arial.ttf"
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                font = ImageFont.truetype(fp, font_size)
                break
        if not font:
            font = ImageFont.load_default()
            
        text_x = 18 * scale
        text_y = 236 * scale
        
        # Text style: White fill with thin dark navy outline (#1e293b)
        outline_color = (30, 41, 59, 255) # #1e293b
        fill_color = (255, 255, 255, 255)   # #ffffff
        
        stroke_w = int(2.2 * scale)
        
        # Render stroke outline around text
        for dx in range(-stroke_w, stroke_w + 1):
            for dy in range(-stroke_w, stroke_w + 1):
                if dx*dx + dy*dy <= stroke_w*stroke_w + 1:
                    draw.text((text_x + dx, text_y + dy), word_text, font=font, fill=outline_color)
                    
        # Render main white text
        draw.text((text_x, text_y), word_text, font=font, fill=fill_color)
        
        # Downsample cleanly to 504 x 349
        final_img = canvas.resize((504, 349), Image.Resampling.LANCZOS)
        final_img.save(filename)
        print(f"Saved {filename}")

    # Generate logos for the 3 key wording variations
    render_logo("razaner", "public/prazaner_logo_option1_razaner.png")
    render_logo("azaner", "public/prazaner_logo_option2_azaner.png")
    render_logo("Prazaner", "public/prazaner_logo_option3_full.png")

extract_and_build_logos()
