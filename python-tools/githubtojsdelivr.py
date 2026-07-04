import os
import re

# config
TARGET_DIR = "pages"

def convert_urls(html_content):
    pattern = r'(src|href)=(["\'])(?:https?:)?\/\/([a-zA-Z0-9\-]+)\.github\.io\/([a-zA-Z0-9\-\._]+)\/(.*?)\2'
    replacement = r'\1=\2https://cdn.jsdelivr.net/gh/\3/\4/\5\2'
    return re.sub(pattern, replacement, html_content)

def main():
    if not os.path.exists(TARGET_DIR):
        print(f"Directory '{TARGET_DIR}' not found.")
        return

    html_files = [f for f in os.listdir(TARGET_DIR) if f.endswith('.html')]
    if not html_files:
        print(f"No HTML files found in '{TARGET_DIR}'.")
        return

    for filename in html_files:
        file_path = os.path.join(TARGET_DIR, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            updated_content = convert_urls(content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            print(f"Successfully converted: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    main()