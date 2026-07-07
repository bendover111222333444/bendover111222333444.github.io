import os
import re
from bs4 import BeautifulSoup

# ==========================================
# CONFIGURATION / CUSTOMIZATION
# ==========================================
TARGET_DIRECTORY = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\games\gn-math\pages"  
RECURSIVE = False  
# ==========================================

OLD_YT_GAME = "https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@main/ytgame.js"
NEW_YT_GAME = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/games/gn-math/ytgame.js"
FALLBACK_JS = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/js/games/request-fallback.js"

def clean_and_swap_file(file_path):
    print(f"Processing: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Clean up stray analytics tags outside the normal DOM using Regex
    content = re.sub(r'<script async src="https://www\.googletagmanager\.com/gtag/js\?id=G-L7856P3VNT".*?></script>', '', content, flags=re.DOTALL)
    gtag_inline_pattern = r'<script>\s*window\.dataLayer\s*=\s*window\.dataLayer.*?gtag\(\'config\',\s*\'G-L7856P3VNT\'\);\s*</script>'
    content = re.sub(gtag_inline_pattern, '', content, flags=re.DOTALL)

    # 2. Use BeautifulSoup to handle elements
    soup = BeautifulSoup(content, "html.parser")
    
    # Swap the old ytgame link out for your new math location, and strip the nonces
    for script in soup.find_all("script", src=OLD_YT_GAME):
        script['src'] = NEW_YT_GAME
        if 'nonce' in script.attrs:
            del script['nonce']

    # Inject the request fallback script tag at the absolute top of the <head>
    # Check if it already exists first so we don't duplicate it on rerun
    if not soup.find("script", src=FALLBACK_JS):
        fallback_tag = soup.new_tag("script", src=FALLBACK_JS)
        if soup.head:
            soup.head.insert(0, fallback_tag)
        elif soup.html:
            soup.html.insert(0, fallback_tag)
        else:
            soup.insert(0, fallback_tag)
        
    # Drop the malicious obfuscated layout script at the bottom
    for script in soup.find_all("script"):
        if script.string and "UravPbGESYjDUNqxKcf$Vqza" in script.string:
            script.decompose()

    # Drop sidebar ad divs
    for ad_id in ["sidebarad1", "sidebarad2"]:
        ad_div = soup.find("div", id=ad_id)
        if ad_div:
            ad_div.decompose()

    # Convert back to string text
    cleaned_content = str(soup)

    # 3. Clean remaining CSS rules inside <style> blocks
    css_patterns = [
        r"#sidebarad1\s*,\s*#sidebarad2\s*\{[^}]*\}",
        r"#sidebarad1\s*\{[^}]*\}",
        r"#sidebarad2\s*\{[^}]*\}",
        r"\.sidebar-close\s*\{[^}]*\}",
        r"\.sidebar-frame\s*\{[^}]*\}"
    ]
    for pattern in css_patterns:
        cleaned_content = re.sub(pattern, "", cleaned_content, flags=re.IGNORECASE)

    cleaned_content = cleaned_content.replace("<style>\n\n</style>", "").replace("<style></style>", "")

    # Save changes
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(cleaned_content)

def main():
    if not os.path.exists(TARGET_DIRECTORY):
        print(f"Error: Directory '{TARGET_DIRECTORY}' missing.")
        return

    count = 0
    if RECURSIVE:
        for root, _, files in os.walk(TARGET_DIRECTORY):
            for file in files:
                if file.lower().endswith((".html", ".htm")):
                    clean_and_swap_file(os.path.join(root, file))
                    count += 1
    else:
        for file in os.listdir(TARGET_DIRECTORY):
            if file.lower().endswith((".html", ".htm")):
                clean_and_swap_file(os.path.join(TARGET_DIRECTORY, file))
                count += 1
                
    print(f"\nCompleted! Adjusted links and script hierarchy in {count} file(s).")

if __name__ == "__main__":
    main()