import os
import re

# Target directory ('.' means the current folder where the script is running)
directory_path = r'C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\games\ubg\pages'

def inject_script_to_html_files(directory):
    # Target URL to check for duplicates
    target_url = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io@main/js/games/interceptor.js"

    # Loop through all files in the directory
    for filename in os.listdir(directory):
        if filename.lower().endswith('.html'):
            file_path = os.path.join(directory, filename)
            
            # Get the filename without the extension
            filename_without_ext = os.path.splitext(filename)[0]

            # Define the snippet to inject
            snippet = f"""
<div data-src="https://cdn.jsdelivr.net/gh/ubghyper/GameList.github.io@main/{filename_without_ext}/index.html" id="intercept"></div>
<script defer="" src="{target_url}"></script>"""

            try:
                # Read the file content
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()

                # Strictly check if the specific script URL already exists in the file
                if target_url in content:
                    print(f"Skipping {filename} (script URL already exists)")
                    continue

                # Use regular expression to find the <head> tag (case-insensitive)
                updated_content, count = re.subn(
                    r'(<head\b[^>]*>)', 
                    rf'\1{snippet}', 
                    content, 
                    flags=re.IGNORECASE, 
                    count=1
                )

                if count > 0:
                    # Write the updated content back to the file
                    with open(file_path, 'w', encoding='utf-8') as file:
                        file.write(updated_content)
                    print(f"Successfully updated: {filename}")
                else:
                    print(f"Warning: Could not find <head> tag in {filename}")

            except Exception as e:
                print(f"Error processing file {filename}: {e}")

if __name__ == "__main__":
    inject_script_to_html_files(directory_path)