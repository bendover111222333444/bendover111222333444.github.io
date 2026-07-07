import subprocess

# config
SCRIPTS_TO_RUN = [
    "delete.py",
    "scrape.py",
    "rewrite.py",
]

def main():
    for script in SCRIPTS_TO_RUN:
        print(f"=== Starting: {script} ===")
        try:
            # Runs the script and waits for it to complete
            result = subprocess.run(["python", script], check=True)
            print(f"=== Finished: {script} successfully ===\n")
        except subprocess.CalledProcessError:
            print(f"❌ Error: {script} failed. Stopping the sequence.")
            break

if __name__ == "__main__":
    main()