import base64

with open('public/prazaner_logo_transparent.png', 'rb') as f:
    b64_str = base64.b64encode(f.read()).decode('utf-8')

print(f"Base64 length: {len(b64_str)}")
print(f"Data URI prefix: data:image/png;base64,{b64_str[:50]}...")
