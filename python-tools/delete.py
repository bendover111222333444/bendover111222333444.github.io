import os
import shutil

# config
TARGET_DIR = "html"

def main():
    if not os.path.exists(TARGET_DIR):
        print(f"Directory '{TARGET_DIR}' not found.")
        return

    print(f"Warning: Deleting all contents inside '{TARGET_DIR}'...")
    
    for filename in os.listdir(TARGET_DIR):
        file_path = os.path.join(TARGET_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
                print(f"Deleted file: {file_path}")
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
                print(f"Deleted directory: {file_path}")
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

    print("Directory clearing completed.")

if __name__ == "__main__":
    main()