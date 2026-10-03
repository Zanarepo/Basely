import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_gradient_mask(width, height, angle=45):
    """Creates a smooth linear gradient image from violet (#7c3aed) to indigo (#4f46e5)."""
    gradient = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    # Colors: Violet (#8b5cf6) to Indigo (#4f46e5)
    c1 = (139, 92, 246) # #8b5cf6
    c2 = (79, 70, 229)  # #4f46e5
    
    for y in range(height):
        for x in range(width):
            # calculate position along gradient angle
            t = (x / width * 0.6 + y / height * 0.4)
            t = max(0.0, min(1.0, t))
            r = int(c1[0] * (1 - t) + c2[0] * t)
            g = int(c1[1] * (1 - t) + c2[1] * t)
            b = int(c1[2] * (1 - t) + c2[2] * t)
            gradient.putpixel((x, y), (r, g, b, 255))
    return gradient

def generate_svg_logo(version=1, word="razaner"):
    """
    Generates high quality SVG string for Prazaner logo.
    Icon combines 'P' and 'r' (Pr monogram).
    """
    # Gradient definition
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <defs>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333ea" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4f46e5" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background: Pure White -->
  <rect width="1000" height="700" fill="#ffffff" />

  <!-- Logo Mark Group (Icon top-left or centered) -->
  <g transform="translate(120, 80)">
'''
    if version == 1:
        # P+r Monogram: outer loop P, stem splitting into P leg + r leg
        svg += '''
    <!-- Outer P Loop and Stem -->
    <path d="M 60 220 L 60 70 C 60 30, 90 10, 150 10 C 230 10, 270 50, 270 120 C 270 190, 220 220, 150 220 L 60 220 Z" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="28" stroke-linejoin="round" stroke-linecap="round"/>
    
    <!-- Inner P Loop -->
    <path d="M 120 160 L 120 70 C 120 55, 135 45, 160 45 C 200 45, 220 70, 220 105 C 220 140, 190 160, 160 160 Z" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="24" stroke-linejoin="round" stroke-linecap="round"/>

    <!-- P Leg going down -->
    <path d="M 60 220 L 60 320" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="28" stroke-linecap="round"/>
          
    <!-- r Leg branching from P stem -->
    <path d="M 105 220 L 105 260 C 105 290, 130 320, 150 320" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="26" stroke-linecap="round"/>
'''
    elif version == 2:
        # Integrated double-stem P+r mark matching parzana_logo style precisely
        svg += '''
    <path d="M 50 330 L 50 75 C 50 35, 85 10, 155 10 C 245 10, 290 55, 290 135 C 290 215, 235 255, 140 255 L 50 255" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="32" stroke-linejoin="round" stroke-linecap="round"/>
    
    <path d="M 115 195 L 115 70 C 115 50, 135 38, 165 38 C 210 38, 230 65, 230 115 C 230 165, 195 195, 150 195 Z" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="26" stroke-linejoin="round"/>

    <!-- Dual Leg (P Stem + R Leg) -->
    <path d="M 115 255 L 115 330" 
          fill="none" stroke="url(#purpleGrad)" stroke-width="28" stroke-linecap="round"/>
'''
    svg += f'''
  </g>

  <!-- Wordmark Text: White filled with clean dark border on white background -->
  <text x="120" y="550" 
        font-family="'Comfortaa', 'Outfit', 'Montserrat', 'Arial Rounded MT Bold', sans-serif" 
        font-size="160" 
        font-weight="700" 
        letter-spacing="2"
        fill="#ffffff" 
        stroke="#1e1b4b" 
        stroke-width="4" 
        stroke-linejoin="round">{word}</text>
</svg>
'''
    return svg

print("Script template ready")
