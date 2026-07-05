# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
INTERCEPTOR_SCRIPT_URL = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/js/games/interceptor.js"
TARGET_DIR = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\python-tools\html" 
# ==================================================================

import os
import re

def convert_iframe_to_intercept():
    print("==================================================")
    print("      IFRAME TO DIV CONVERTER & PATCHER           ")
    print("==================================================")
    
    if not TARGET_DIR or not os.path.exists(TARGET_DIR):
        print(f"❌ Target directory invalid or not found: {TARGET_DIR}")
        return
        
    print(f"✅ Target Directory Configured: {TARGET_DIR}\n")

    patched_count = 0
    skipped_count = 0

    # Regular expression updated to capture standard 'src' instead of 'data-src'
    iframe_regex = re.compile(r'<iframe\s+[^>]*src=["\']([^"\']+)["\'][^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL)

    for root_path, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.endswith(".html") or file.endswith(".htm"):
                file_path = os.path.join(root_path, file)
                
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                # Skip if already processed
                if 'id="intercept"' in content:
                    skipped_count += 1
                    continue

                # Find the src link inside the existing iframe
                match = iframe_regex.search(content)
                if match:
                    extracted_url = match.group(1)
                    
                    # Remove the old iframe from the content
                    content_without_iframe = iframe_regex.sub('', content)
                    
                    # Create the new tags using top-level configuration
                    intercept_div = f'  <div id="intercept" data-src="{extracted_url}"></div>\n'
                    script_tag = f'  <script src="{INTERCEPTOR_SCRIPT_URL}" defer></script>\n'
                    
                    # Inject the new elements into the head
                    if "<head>" in content_without_iframe:
                        patched_content = content_without_iframe.replace(
                            "<head>", 
                            f"<head>\n{intercept_div}{script_tag}"
                        )
                        
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(patched_content)
                        
                        print(f"🔄 Converted & Patched: {os.path.relpath(file_path, TARGET_DIR)}")
                        patched_count += 1
                    else:
                        print(f"⚠️ Skipped (No <head> tag found): {os.path.relpath(file_path, TARGET_DIR)}")
                        skipped_count += 1
                else:
                    print(f"⏭️ Skipped (No iframe found): {os.path.relpath(file_path, TARGET_DIR)}")
                    skipped_count += 1

    print("\n==================================================")
    print("                PROCESS COMPLETE                  ")
    print("==================================================")
    print(f" Total files successfully converted: {patched_count}")
    print(f" Total files skipped/unmatched:     {skipped_count}")
    print("==================================================")

if __name__ == "__main__":
    convert_iframe_to_intercept()