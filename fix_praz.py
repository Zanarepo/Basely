import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace any multiple Praz- chained together
    # E.g. Praz-Praz-AI -> Praz-AI
    # We can just do a while loop replacing Praz-Praz- with Praz-
    new_content = content
    while 'Praz-Praz-AI' in new_content:
        new_content = new_content.replace('Praz-Praz-AI', 'Praz-AI')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
