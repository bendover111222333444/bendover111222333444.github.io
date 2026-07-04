import os
import requests
from pathlib import Path

# config
# 1. json url
JSON_URL = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/games/ubg/games.json"

# 2. request domain
BASE_SERVER_URL = "https://ubghyper.github.io/GameList.github.io"

# 3. folder paths
HTML_DIR = Path("html")
IMAGE_DIR = Path("image")

# 4. url strucutres
HTML_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{url}}/index.html"
IMAGE_REQUEST_TEMPLATE = f"{BASE_SERVER_URL}/{{url}}/{{image}}"

# 5. file names
# {url} will be replaced by the game's url string (e.g., 'Drive-Mad')
# {image} will be replaced by the game's image string (e.g., 'logo.png')
HTML_FILENAME_TEMPLATE = "{url}.html"
IMAGE_FILENAME_TEMPLATE = "{image}"

HTML_DIR.mkdir(exist_ok=True)
IMAGE_DIR.mkdir(exist_ok=True)

def download_file(url, output_path):
    """Downloads a file from a URL and saves it to the given path."""
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Successfully downloaded: {output_path.name}")
            return True
        else:
            print(f"Failed to download {url} (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def main():
    print("Fetching games JSON file...")
    try:
        response = requests.get(JSON_URL)
        response.raise_for_status()
        games_list = response.json()
    except Exception as e:
        print(f"Error fetching JSON: {e}")
        return

    print(f"Found {len(games_list)} games. Starting download process...\n")

    for index, game in enumerate(games_list, 1):
        url_var = game.get("url")
        image_var = game.get("image")
        game_name = game.get("name", "Unknown Game")

        if not url_var:
            print(f"[{index}] Skipping '{game_name}' because it lacks a 'url' key.")
            continue

        print(f"[{index}] Processing game: {game_name}")

        html_url = HTML_REQUEST_TEMPLATE.format(url=url_var)
        
        html_filename = HTML_FILENAME_TEMPLATE.format(url=url_var)
        html_filename = os.path.basename(html_filename) # Sanitize path injection
        html_save_path = HTML_DIR / html_filename

        print(f"  -> Fetching HTML from: {html_url}")
        download_file(html_url, html_save_path)

        if image_var:

            image_url = IMAGE_REQUEST_TEMPLATE.format(url=url_var, image=image_var)

            image_filename = IMAGE_FILENAME_TEMPLATE.format(url=url_var, image=image_var)
            image_filename = os.path.basename(image_filename) # Sanitize path injection
            image_save_path = IMAGE_DIR / image_filename

            print(f"  -> Fetching Image from: {image_url}")
            download_file(image_url, image_save_path)
        else:
            print(f"  -> No image specified for {game_name}")
            
        print("-" * 50)

    print("\nAll tasks completed!")

if __name__ == "__main__":
    main()