import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We only want to replace text in user-facing places (like inside tags or strings).
    # Since doing true AST parsing is hard, we'll use regex for common cases,
    # or just replace whole words, but exclude imports/variables.
    
    # 1. Replace "AI Copilot" with "Praz-AI"
    new_content = re.sub(r'\bAI Copilot\b', 'Praz-AI', content)
    
    # 2. Replace "Copilot" with "Praz-AI"
    new_content = re.sub(r'\bCopilot\b', 'Praz-AI', new_content)
    
    # 3. Replace standalone "AI" with "Praz-AI" 
    # But only if it's not part of a variable name (like `isAI`), which we handle by word boundaries.
    # However, things like "AI-POWERED" -> "Praz-AI-POWERED"
    new_content = re.sub(r'\bAI\b(?![-_a-z])', 'Praz-AI', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
