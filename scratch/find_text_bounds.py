import numpy as np
from PIL import Image

img = Image.open('public/image copy 3.png').convert('RGBA')
# Let's crop the text area around y: 400..560, x: 150..900
text_region = img.crop((150, 400, 900, 560))
text_region.save('public/_debug_text_full.png')

# Let's analyze x coordinates of non-dark pixels in text_region
arr = np.array(text_region)
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
# Bright white text mask
white = (r > 180) & (g > 180) & (b > 180)

# Find column min and max where white is True
white_cols = np.where(white.any(axis=0))[0]
print("White text columns relative to 150:", white_cols[0], "to", white_cols[-1])
print("Absolute X range:", 150 + white_cols[0], "to", 150 + white_cols[-1])
