# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
DOWNLOAD_HTML = True
DOWNLOAD_IMAGES = False

JSON_URL = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/games/ubg/games.json"
BASE_SERVER_URL = "https://ubghyper.github.io/GameList.github.io"
# ==================================================================

import os
import shutil
import requests
from pathlib import Path

HTML_DIR = Path("html")
IMAGE_DIR = Path("image")

# Local cache storage directories to prevent duplicate server requests
CACHE_HTML_DIR = Path(".cache_html")
CACHE_IMAGE_DIR = Path(".cache_image")

HTML_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{url}}/index.html"
IMAGE_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{url}}/{{image}}"

HTML_FILENAME_TEMPLATE = "{url}.html"
IMAGE_FILENAME_TEMPLATE = "{image}"

# Ensure output and caching structures exist
if DOWNLOAD_HTML:
    HTML_DIR.mkdir(exist_ok=True)
    CACHE_HTML_DIR.mkdir(exist_ok=True)
if DOWNLOAD_IMAGES:
    IMAGE_DIR.mkdir(exist_ok=True)
    CACHE_IMAGE_DIR.mkdir(exist_ok=True)

def download_file(url, cache_path, final_path):
    """Downloads an asset into cache, then copies it to the final destination."""
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            # Write directly to our local permanent cache folder
            with open(cache_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Instantly copy it out from the cache to the actual final destination
            shutil.copy2(cache_path, final_path)
            print(f"   ⬇️ Network Downloaded & Cached: {final_path.name}")
            return True
        else:
            print(f"   ❌ Failed to download {url} (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ Network Error downloading {url}: {e}")
        return False

def main():
    print("==================================================")
    print("       CACHED GAME SCRAPER / DOWNLOADER           ")
    print("==================================================")
    
    print("Fetching games JSON file...")
    try:
        response = requests.get(JSON_URL, timeout=10)
        response.raise_for_status()
        games_list = response.json()
    except Exception as e:
        print(f"❌ Error fetching JSON: {e}")
        return

    print(f"Found {len(games_list)} games. Processing files...\n")

    for index, game in enumerate(games_list, 1):
        url_var = game.get("url")
        image_var = game.get("image")
        game_name = game.get("name", "Unknown Game")

        if not url_var:
            print(f"[{index}] Skipping '{game_name}' (missing 'url' property).")
            continue

        print(f"[{index}] Processing game: {game_name}")

        # --- Handle HTML Files ---
        if DOWNLOAD_HTML:
            html_url = HTML_REQUEST_TEMPLATE.format(url=url_var)
            html_filename = os.path.basename(HTML_FILENAME_TEMPLATE.format(url=url_var))
            
            html_cache_path = CACHE_HTML_DIR / html_filename
            html_final_path = HTML_DIR / html_filename

            # Check if file exists in the local storage cache
            if html_cache_path.exists():
                shutil.copy2(html_cache_path, html_final_path)
                print(f"   ⚡ Cache Hit (Copied Local file): {html_filename}")
            else:
                download_file(html_url, html_cache_path, html_final_path)

        # --- Handle Image Files ---
        if DOWNLOAD_IMAGES:
            if image_var:
                image_url = IMAGE_REQUEST_TEMPLATE.format(url=url_var, image=image_var)
                image_filename = os.path.basename(IMAGE_FILENAME_TEMPLATE.format(url=url_var, image=image_var))
                
                image_cache_path = CACHE_IMAGE_DIR / image_filename
                image_final_path = IMAGE_DIR / image_filename

                # Check if file exists in the local storage cache
                if image_cache_path.exists():
                    shutil.copy2(image_cache_path, image_final_path)
                    print(f"   ⚡ Cache Hit (Copied Local file): {image_filename}")
                else:
                    download_file(image_url, image_cache_path, image_final_path)
            else:
                print(f"   ⚠️ No image metadata defined for {game_name}")
            
        print("-" * 50)

    print("\n==================================================")
    print("           CACHING RUN COMPLETE                   ")
    print("==================================================")

if __name__ == "__main__":
    main()