from PIL import Image

ai_path = r"C:\Users\princ\.gemini\antigravity-ide\brain\95bf538f-fc89-41c2-acac-d6d8b5a6bb8b\prazaner_logo_ai_improved_1786624936101.png"
img = Image.open(ai_path)
img.save("public/prazaner_logo_ai_concept.png")
print("Saved AI concept to public/prazaner_logo_ai_concept.png")
