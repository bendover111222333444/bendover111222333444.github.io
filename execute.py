import os

def replace_url_in_folder(folder_path):
    # Define the target URL to find and the replacement URL
    target_url = "https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@main/ytgame.js"
    replacement_url = "https://cdn.jsdelivr.net/gh/bendover111222333444/bendover111222333444.github.io/games/gn-math/ytgame.js"
    
    # Common text file extensions to look out for
    valid_extensions = ('.html', '.js', '.json', '.txt', '.css')
    
    count = 0

    # Walk through all directories and files in the specified path
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(valid_extensions):
                file_path = os.path.join(root, file)
                
                try:
                    # Read the original file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # If the target URL exists in the file, replace it
                    if target_url in content:
                        updated_content = content.replace(target_url, replacement_url)
                        
                        # Write the updated content back to the file
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(updated_content)
                            
                        print(f"Updated: {file_path}")
                        count += 1
                        
                except Exception as e:
                    print(f"Could not process file {file_path}: {e}")
                    
    print(f"\nTask complete. Total files updated: {count}")

# Set the path to the folder containing your files
# Example: "C:/Users/Name/Documents/game-folder" or "./my-game-folder"
target_folder = r"C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\games\gn-math\pages"

if __name__ == "__main__":
    replace_url_in_folder(target_folder)