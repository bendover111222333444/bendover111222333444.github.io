# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
DOWNLOAD_HTML = True
DOWNLOAD_IMAGES = True

# Can be a remote URL link OR a local file path directory (e.g., "data/games.json")
JSON_SOURCE = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\python-tools\games.json"
BASE_SERVER_URL = "https://gn-math.dev/"

# Control how many requests/downloads happen at the exact same time
MAX_CONCURRENT_WORKERS = 10 
# ==================================================================

import os
import json
import shutil
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

HTML_DIR = Path("html")
IMAGE_DIR = Path("image")

HTML_NAME = "url"
IMAGE_NAME = "cover"

# Local cache storage directories to prevent duplicate server requests
CACHE_HTML_DIR = Path(".cache_html")
CACHE_IMAGE_DIR = Path(".cache_image")

HTML_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{url}}"
IMAGE_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{image}}"

HTML_FILENAME_TEMPLATE = "{url}"
IMAGE_FILENAME_TEMPLATE = "{image}"

# Ensure output and caching structures exist
if DOWNLOAD_HTML:
    HTML_DIR.mkdir(exist_ok=True)
    CACHE_HTML_DIR.mkdir(exist_ok=True)
if DOWNLOAD_IMAGES:
    IMAGE_DIR.mkdir(exist_ok=True)
    CACHE_IMAGE_DIR.mkdir(exist_ok=True)

def download_file(url, cache_path, final_path):
    """Downloads an asset into final destination, then links it to cache instantly."""
    cache_path = Path(cache_path)
    final_path = Path(final_path)
    
    try:
        response = requests.get(url, stream=True, timeout=10)
        
        if response.status_code == 200:
            final_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(final_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024): # 1MB chunks
                    if chunk:
                        f.write(chunk)
            
            try:
                if cache_path.exists():
                    cache_path.unlink()
                os.link(final_path, cache_path) 
            except OSError:
                shutil.copy2(final_path, cache_path)
            
            print(f"   ⬇️ Network Downloaded & Cached: {final_path.name}")
            return True
        else:
            print(f"   ❌ Failed to download {url} (Status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"   ❌ Network Error downloading {url}: {e}")
        return False

def process_asset(url, cache_path, final_path, filename):
    """Handles cache linking or downloading for a single asset."""
    if cache_path.exists():
        try:
            if final_path.exists():
                final_path.unlink()
            os.link(cache_path, final_path)
            print(f"   ⚡ Cache Hit (Linked Local file): {filename}")
        except OSError:
            shutil.copy2(cache_path, final_path)
            print(f"   ⚡ Cache Hit (Copied Local file): {filename}")
    else:
        download_file(url, cache_path, final_path)

def process_game(game_data):
    """Worker task that handles a single game payload."""
    index, game = game_data
    url_var = game.get(HTML_NAME)
    image_var = game.get(IMAGE_NAME)
    game_name = game.get("name", "Unknown Game")

    if not url_var:
        print(f"[{index}] Skipping '{game_name}' (missing 'url' property).")
        return

    print(f"[{index}] Starting processing for: {game_name}")

    # --- Handle HTML Files ---
    if DOWNLOAD_HTML:
        html_url = HTML_REQUEST_TEMPLATE.format(url=url_var)
        html_filename = os.path.basename(HTML_FILENAME_TEMPLATE.format(url=url_var))
        
        html_cache_path = CACHE_HTML_DIR / html_filename
        html_final_path = HTML_DIR / html_filename
        
        process_asset(html_url, html_cache_path, html_final_path, html_filename)

    # --- Handle Image Files ---
    if DOWNLOAD_IMAGES:
        if image_var:
            image_url = IMAGE_REQUEST_TEMPLATE.format(url=url_var, image=image_var)
            image_filename = os.path.basename(IMAGE_FILENAME_TEMPLATE.format(url=url_var, image=image_var))
            
            image_cache_path = CACHE_IMAGE_DIR / image_filename
            image_final_path = IMAGE_DIR / image_filename
            
            process_asset(image_url, image_cache_path, image_final_path, image_filename)
        else:
            print(f"   ⚠️ No image metadata defined for {game_name}")

def main():
    print("==================================================")
    print("       CACHED GAME SCRAPER / DOWNLOADER           ")
    print("==================================================")
    
    print(f"Fetching games JSON source from: {JSON_SOURCE}")
    try:
        # Check if the source config is a web link or local directory path
        if JSON_SOURCE.startswith("http://") or JSON_SOURCE.startswith("https://"):
            response = requests.get(JSON_SOURCE, timeout=10)
            response.raise_for_status()
            games_list = response.json()
        else:
            with open(JSON_SOURCE, 'r', encoding='utf-8') as f:
                games_list = json.load(f)
    except Exception as e:
        print(f"❌ Error fetching/reading JSON: {e}")
        return

    print(f"Found {len(games_list)} games. Processing files asynchronously...\n")

    # Map tasks with index tracking for clean terminal logging
    tasks = list(enumerate(games_list, 1))

    # Fire off simultaneous network requests using a ThreadPool
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_WORKERS) as executor:
        executor.map(process_game, tasks)

    print("\n==================================================")
    print("           CACHING RUN COMPLETE                   ")
    print("==================================================")

if __name__ == "__main__":
    main()