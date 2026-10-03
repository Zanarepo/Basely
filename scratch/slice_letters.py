import os
from PIL import Image

def slice_parzana_letters():
    # Load parzana_logo.png
    im = Image.open('public/parzana_logo.png').convert('RGBA')
    w, h = im.size # 504, 349
    
    # Text area crop: y from ~240 to 320, x from ~10 to 490
    text_crop = im.crop((10, 240, 490, 320))
    text_crop.save('public/_debug_text_cropped.png')
    
    # Let's inspect letter positions in 'arzana':
    # a: ~12 to 85
    # r: ~85 to 155
    # z: ~155 to 230
    # a: ~230 to 300
    # n: ~300 to 370
    # a: ~370 to 445

    letter_a = im.crop((15, 248, 82, 310))
    letter_r = im.crop((88, 248, 150, 310))
    letter_z = im.crop((156, 248, 226, 310))
    letter_n = im.crop((305, 248, 368, 310))
    
    letter_a.save('public/_letter_a.png')
    letter_r.save('public/_letter_r.png')
    letter_z.save('public/_letter_z.png')
    letter_n.save('public/_letter_n.png')
    print("Extracted exact letters from parzana_logo.png")

slice_parzana_letters()
