import os
import json
import requests

# config
JSON_URL = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/games/ubg/games.json"

# key
TARGET_KEY = "url"

# file name
OUTPUT_FILE = f"{TARGET_KEY}s_list.json"

def main():
    try:
        response = requests.get(JSON_URL)
        response.raise_for_status()
        games_list = response.json()
    except Exception as e:
        print(f"Error fetching JSON: {e}")
        return

    extracted_list = []
    for game in games_list:
        if TARGET_KEY in game:
            key_value = game[TARGET_KEY]
            image_filename = game.get("image", "")
            _, ext = os.path.splitext(image_filename)
            
            extracted_list.append({
                "url": key_value,
                "extention": ext
            })

    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(extracted_list, f, indent=2)
        print(f"Success! Saved to {OUTPUT_FILE}")
    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    main()