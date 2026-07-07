import os
from bs4 import BeautifulSoup

# ==========================================
# CONFIGURATION
# ==========================================
TARGET_DIRECTORY = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\games\ubg\pages"  
RECURSIVE = False 
# ==========================================

FALLBACK_JS = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/js/games/request-fallback.js"

def remove_fallback_script(file_path):
    print(f"Processing: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "html.parser")
    
    # Find the specific script tag and completely delete it
    scripts_removed = False
    for script in soup.find_all("script", src=FALLBACK_JS):
        script.decompose()
        scripts_removed = True

    # Only save the file if we actually found and removed the tag
    if scripts_removed:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(str(soup))

def main():
    if not os.path.exists(TARGET_DIRECTORY):
        print(f"Error: Directory '{TARGET_DIRECTORY}' missing.")
        return

    count = 0
    if RECURSIVE:
        for root, _, files in os.walk(TARGET_DIRECTORY):
            for file in files:
                if file.lower().endswith((".html", ".htm")):
                    remove_fallback_script(os.path.join(root, file))
                    count += 1
    else:
        for file in os.listdir(TARGET_DIRECTORY):
            if file.lower().endswith((".html", ".htm")):
                remove_fallback_script(os.path.join(TARGET_DIRECTORY, file))
                count += 1
                
    print(f"\nFinished! Checked {count} file(s) and removed the fallback script tag.")

if __name__ == "__main__":
    main()