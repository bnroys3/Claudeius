import os
import sys
import time
import webbrowser
import subprocess
import urllib.request
from pathlib import Path

PORT = 8000
URL  = f"http://localhost:{PORT}"
HERE = Path(__file__).parent

def check_env():
    missing = [v for v in ("ANTHROPIC_API_KEY", "GITHUB_TOKEN") if not os.environ.get(v)]
    if missing:
        print("WARNING: missing environment variables:")
        for m in missing:
            print(f"  export {m}=your_value_here")
        print()

def wait_for_server(timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(URL + "/health", timeout=1)
            return True
        except Exception:
            time.sleep(0.4)
    return False

def pause():
    input("\nPress Enter to close...")

try:
    check_env()
    print(f"Starting Claudius on {URL} ...")

    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", str(PORT), "--reload"],
        cwd=str(HERE / "backend"),
    )

    if wait_for_server():
        print("Ready! Opening browser...\n")
        webbrowser.open(URL)
    else:
        print(f"Server did not start. Check that dependencies are installed:")
        print(f"  pip install -r requirements.txt")
        pause()
        sys.exit(1)

    print("Press Ctrl+C to stop.\n")

    try:
        proc.wait()
    except KeyboardInterrupt:
        print("\nStopping...")
        proc.terminate()
        proc.wait()
        print("Done.")

except Exception as e:
    print(f"\nError: {e}")
    pause()
    sys.exit(1)