# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
TARGET_DIR = "html"
# Adjust this base path if your jsDelivr folder structure changes:
JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/ubggames-web/ubggames-web.github.io@main/"
# ==================================================================

import os
import re
from urllib.parse import urlparse, urlunparse

def process_file(file_path, game_name):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. Convert absolute github.io links
    github_pattern = r'(?:https?:)?\/\/[a-zA-Z0-9\-]+\.github\.io[^\s"\'<>]*'
    
    def convert_github_io(match):
        original_url = match.group(0)
        clean_url = original_url.rstrip('"\'<> ')
        trailing_stuff = original_url[len(clean_url):]
        
        parsed = urlparse(clean_url)
        host = parsed.netloc
        path_parts = [p for p in parsed.path.split('/') if p]
        
        if len(path_parts) < 1:
            return original_url
            
        user = host.split('.')[0]
        repo = path_parts[0]
        remaining_path = "/".join(path_parts[1:])
        
        clean_file_path = remaining_path.split('?')[0].split('#')[0]
        _, ext = os.path.splitext(clean_file_path)
        
        if not ext:
            if remaining_path and not remaining_path.endswith('/'):
                remaining_path += '/'
            remaining_path += 'index.html'
            
        new_path = f"/gh/{user}/{repo}@main/{remaining_path}"
        new_url = urlunparse(('https', 'cdn.jsdelivr.net', new_path, parsed.params, parsed.query, parsed.fragment))
        return f"{new_url}{trailing_stuff}"

    updated_content = re.sub(github_pattern, convert_github_io, content)

    # 2. Convert relative local links (src="js/..." or href="css/...")
    # This regex catches relative assets while ignoring absolute URLs (http, https, //, data:, etc.)
    local_pattern = r'(src|href)=["\'](?!(?:https?:)?\/\/|data:|#)([^"\']+)["\']'

    def convert_local_relative(match):
        attribute = match.group(1) # 'src' or 'href'
        relative_path = match.group(2).lstrip('/')
        
        # Clean leading "./" if present
        if relative_path.startswith("./"):
            relative_path = relative_path[2:]

        # Build the exact jsDelivr destination routing through your game name subfolder
        new_url = f"{JSDELIVR_BASE}/{game_name}/{relative_path}"
        return f'{attribute}="{new_url}"'

    updated_content = re.sub(local_pattern, convert_local_relative, updated_content)

    # Save changes if something updated
    if content != updated_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"🔄 Converted all links in: {file_path}")

def main():
    if not os.path.exists(TARGET_DIR):
        print(f"Directory '{TARGET_DIR}' not found.")
        return

    print("==================================================")
    print("   LOCAL & GITHUB TO JSDELIVR ROUTE REWRITER      ")
    print("==================================================")

    for root, dirs, files in os.walk(TARGET_DIR):
        for filename in files:
            if filename.endswith((".html", ".htm")):
                file_path = os.path.join(root, filename)
                
                # Determine game name based on its containing folder name, 
                # or fallback to the file's name if it's sitting at the root.
                folder_name = os.path.basename(root)
                game_name = folder_name if folder_name != TARGET_DIR else os.path.splitext(filename)[0]
                
                try:
                    process_file(file_path, game_name)
                except Exception as e:
                    print(f"❌ Error converting links in {file_path}: {e}")

if __name__ == "__main__":
    main()