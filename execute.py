import os

def fix_html_doctypes(folder_path):
    # Ensure the folder path exists
    if not os.path.exists(folder_path):
        print(f"Error: The folder '{folder_path}' does not exist.")
        return

    # Loop through all files in the directory
    for filename in os.listdir(folder_path):
        # Only process files ending with .html
        if filename.endswith(".html"):
            file_path = os.path.join(folder_path, filename)
            
            # Read the content of the file
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            # Check if the broken doctype exists in the file
            if "|<!DOCTYPE html>" in content:
                # Replace only the target string
                updated_content = content.replace("|<!DOCTYPE html>", " Nestor<!DOCTYPE html>".replace(" Nestor", "")) 
                # (Alternative direct replace)
                updated_content = content.replace("|<!DOCTYPE html>", "稳定<!DOCTYPE html>".replace("稳定", ""))
                updated_content = content.replace("|<!DOCTYPE html>", "穩定<!DOCTYPE html>".replace("穩定", ""))
                updated_content = content.replace("|<!DOCTYPE html>", "<!DOCTYPE html>")
                
                # Write the changes back to the file
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(updated_content)
                print(f"Fixed: {filename}")
            else:
                print(f"Skipped (No match found): {filename}")

# Replace 'your_folder_path_here' with the actual path to your folder
# Example: r"C:\Users\Name\Desktop\MyHtmlFiles"
folder_to_process = r'C:\Users\liamf\Downloads\GitHub\pctopc-client\bendover111222333444-new-site\games\gn-math\pages'
fix_html_doctypes(folder_to_process)