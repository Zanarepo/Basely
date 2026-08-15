from PIL import Image

try:
    img = Image.open('public/logo/parzana_icon.png').convert("RGBA")
    
    # Get bounding box of the non-transparent area to remove built-in margins
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Now img is tightly cropped around the visible pixels.
    # We want to make it a perfect square without distorting it, 
    # ensuring it stretches all the way to the edges.
    w, h = img.size
    max_dim = max(w, h)
    
    square_img = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    
    offset_x = (max_dim - w) // 2
    offset_y = (max_dim - h) // 2
    square_img.paste(img, (offset_x, offset_y))
    
    square_img.save('src/app/favicon.ico', format='ICO', sizes=[(16,16), (32, 32), (48,48), (64, 64), (128, 128), (256, 256)])
    print("Favicon maximized and created successfully.")
except Exception as e:
    print(f"Error: {e}")
