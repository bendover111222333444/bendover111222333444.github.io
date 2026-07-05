# ==================================================================
# CONFIGURATION VARIABLES (TOP OF FILE)
# ==================================================================
BASE_CDN_URL = "https://ubghyper.github.io/GameList.github.io/"
TARGET_DIR = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\python-tools\html"
# ==================================================================

import os
import re
import shutil
import urllib.parse
import requests

# Strict HTML attribute matching only
ASSET_REGEX = re.compile(r'(?:src|href)=["\']([^"\']+)["\']', re.IGNORECASE)

# Windows illegal characters filtering (\ / : * ? " < > |)
ILLEGAL_PATH_CHARS = re.compile(r'[:*?"<>|]')

def resolve_custom_dots(link, current_context_dir_url, game_name):
    """
    Parses paths and matches absolute overrides against BASE_CDN_URL.
    """
    link_clean = link.split('?')[0].split('#')[0].strip()
    if not link_clean:
        return None

    parsed = urllib.parse.urlparse(link_clean)
    
    # Check if it is an absolute URL
    if parsed.scheme and parsed.netloc:
        full_url = urllib.parse.urlunparse(parsed)
        if full_url.startswith(BASE_CDN_URL):
            return full_url
        return None

    # Skip external schemes, anchors, and data URIs
    if parsed.scheme or link_clean.startswith("//") or link_clean.startswith("#") or link_clean.startswith("data:"):
        return None

    raw_path = parsed.path

    # Root-relative path
    if raw_path.startswith("/") and not raw_path.startswith("//"):
        return urllib.parse.urljoin(BASE_CDN_URL, raw_path.lstrip("/"))

    # Custom dot counting navigation
    dot_match = re.match(r'^(\.+)(?:/|$)', raw_path)
    if dot_match:
        dots = dot_match.group(1)
        dot_count = len(dots)
        remaining_path = raw_path[len(dots):].lstrip("/")
        
        context_parsed = urllib.parse.urlparse(current_context_dir_url)
        path_segments = [seg for seg in context_parsed.path.split('/') if seg]
        
        steps_up = max(0, dot_count - 1)
        if steps_up > 0:
            new_segments = path_segments[:-steps_up] if steps_up < len(path_segments) else []
        else:
            new_segments = path_segments

        new_path = "/" + "/".join(new_segments)
        if new_path != "/" and not new_path.endswith("/"):
            new_path += "/"
        new_path += remaining_path

        resolved_url = urllib.parse.urlunparse((
            context_parsed.scheme,
            context_parsed.netloc,
            new_path,
            '', '', ''
        ))
        
        if not resolved_url.startswith(BASE_CDN_URL):
            resolved_url = urllib.parse.urljoin(BASE_CDN_URL, remaining_path)
            
        return resolved_url

    return urllib.parse.urljoin(current_context_dir_url, raw_path)

def get_local_save_path(target_url, game_name):
    if not target_url.startswith(BASE_CDN_URL):
        return None
    relative_to_root = target_url[len(BASE_CDN_URL):].lstrip("/")
    if relative_to_root.startswith(f"{game_name}/"):
        relative_path = relative_to_root[len(game_name):].lstrip("/")
    else:
        relative_path = relative_to_root
    return relative_path

def scan_text_for_assets(text, current_context_dir_url, game_name):
    found_urls = set()
    
    # Explicitly check only src and href patterns
    for link in ASSET_REGEX.findall(text):
        resolved_url = resolve_custom_dots(link, current_context_dir_url, game_name)
        if resolved_url:
            found_urls.add(resolved_url)
            
    return found_urls

def fetch_with_fallbacks(target_url, game_name):
    try:
        response = requests.get(target_url, timeout=5)
        if response.status_code == 200:
            return response, target_url
    except Exception:
        pass

    filename = target_url.split('/')[-1]
    
    game_root_url = urllib.parse.urljoin(BASE_CDN_URL, f"{game_name}/{filename}")
    if game_root_url != target_url:
        try:
            response = requests.get(game_root_url, timeout=5)
            if response.status_code == 200:
                return response, game_root_url
        except Exception:
            pass

    common_js_url = urllib.parse.urljoin(BASE_CDN_URL, f"js/{filename}")
    if common_js_url != target_url and common_js_url != game_root_url:
        try:
            response = requests.get(common_js_url, timeout=5)
            if response.status_code == 200:
                return response, common_js_url
        except Exception:
            pass

    absolute_root_url = urllib.parse.urljoin(BASE_CDN_URL, filename)
    if absolute_root_url != target_url and absolute_root_url != game_root_url:
        try:
            response = requests.get(absolute_root_url, timeout=5)
            if response.status_code == 200:
                return response, absolute_root_url
        except Exception:
            pass

    return None, target_url

def process_and_scrape_games():
    print("==================================================")
    print("   STRICT HTML SRC/HREF ASSET SCRAPER WRAPPER     ")
    print("==================================================")
    
    if not TARGET_DIR or not os.path.exists(TARGET_DIR):
        print(f"❌ Target directory invalid or not found: {TARGET_DIR}")
        return
        
    print(f"✅ Processing directory: {TARGET_DIR}\n")

    files = [f for f in os.listdir(TARGET_DIR) if os.path.isfile(os.path.join(TARGET_DIR, f))]

    for file in files:
        if file.endswith(".html") or file.endswith(".htm"):
            html_path = os.path.join(TARGET_DIR, file)
            game_name = os.path.splitext(file)[0]
            
            initial_dir_context = urllib.parse.urljoin(BASE_CDN_URL, f"{game_name}/")

            with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            resolved_assets = scan_text_for_assets(html_content, initial_dir_context, game_name)

            if not resolved_assets:
                print(f"⏭️ Skipped: '{file}' (No valid src/href asset references found)")
                continue

            print(f"📦 Organizing game: '{game_name}'")
            game_folder = os.path.join(TARGET_DIR, game_name)
            os.makedirs(game_folder, exist_ok=True)
            
            new_html_path = os.path.join(game_folder, "index.html")
            with open(new_html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
            
            os.remove(html_path)
            print(f"   📁 Moved HTML to: {os.path.relpath(new_html_path, TARGET_DIR)}")

            downloaded_urls = set()
            queue = list(resolved_assets)

            while queue:
                target_url = queue.pop(0)
                if target_url in downloaded_urls:
                    continue
                
                relative_save_path = get_local_save_path(target_url, game_name)
                if not relative_save_path or ILLEGAL_PATH_CHARS.search(relative_save_path):
                    downloaded_urls.add(target_url)
                    continue

                local_asset_save_path = os.path.join(game_folder, relative_save_path.replace("/", os.sep))
                
                try:
                    os.makedirs(os.path.dirname(local_asset_save_path), exist_ok=True)
                except Exception:
                    downloaded_urls.add(target_url)
                    continue
                
                response, accurate_url = fetch_with_fallbacks(target_url, game_name)

                if response and response.status_code == 200:
                    try:
                        with open(local_asset_save_path, "wb") as f:
                            f.write(response.content)
                        
                        print(f"   ⬇️ Downloaded asset: {target_url}")
                        downloaded_urls.add(target_url)
                        
                    except Exception as e:
                        print(f"   ❌ File write error on path: {local_asset_save_path} | Error: {e}")
                else:
                    print(f"   ❌ Missing asset completely at fallback layer URL: {target_url}")
                    downloaded_urls.add(target_url)

    print("\n==================================================")
    print("                  PROCESS COMPLETE                  ")
    print("==================================================")

if __name__ == "__main__":
    process_and_scrape_games()