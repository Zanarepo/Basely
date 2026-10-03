from PIL import Image

im = Image.open('public/image copy 3.png')
w, h = im.size # 1024, 707

# Bounding box of the icon mark in image copy 3.png:
# Icon is roughly x: 170..410, y: 140..420
icon_crop = im.crop((160, 130, 420, 430))
icon_crop.save('public/_debug_model_icon.png')

text_crop = im.crop((160, 400, 880, 550))
text_crop.save('public/_debug_model_text.png')

print("Saved model debug crops")
