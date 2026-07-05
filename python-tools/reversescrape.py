# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
TARGET_DIR = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\python-tools\html"
# ==================================================================

import os
import shutil

def reverse_game_folders():
    print("==================================================")
    print("         REVERSE SCRAPER: DIRECTORY TO HTML        ")
    print("==================================================")
    
    if not TARGET_DIR or not os.path.exists(TARGET_DIR):
        print(f"❌ Target directory invalid or not found: {TARGET_DIR}")
        return
        
    print(f"✅ Processing root directory: {TARGET_DIR}\n")

    # List everything in the target directory
    items = os.listdir(TARGET_DIR)

    for item in items:
        item_path = os.path.join(TARGET_DIR, item)
        
        # We only care about directories (the game folders)
        if os.path.isdir(item_path):
            index_path = os.path.join(item_path, "index.html")
            
            # Check if this folder contains an index.html file
            if os.path.exists(index_path):
                # The new file name will be the directory name + .html
                new_html_name = f"{item}.html"
                new_html_path = os.path.join(TARGET_DIR, new_html_name)
                
                print(f"📦 Reversing folder: '{item}'")
                
                try:
                    # Move and rename the index.html out to the main directory
                    shutil.move(index_path, new_html_path)
                    print(f"   🔄 Restored: {item} -> {new_html_name}")
                    
                    # Delete the folder and all its downloaded sub-assets
                    shutil.rmtree(item_path)
                    print(f"   🗑️  Cleaned up folder and assets: {item}/")
                    
                except Exception as e:
                    print(f"   ❌ Error processing '{item}': {e}")
            else:
                print(f" there is no files to pull out.")

    print("\n==================================================")
    print("              REVERSE PROCESS COMPLETE             ")
    print("==================================================")

if __name__ == "__main__":
    reverse_game_folders()