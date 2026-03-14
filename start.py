import os
import sys
import time
import subprocess
import webbrowser
import urllib.request
from pathlib import Path

PORT       = 8000
URL        = f"http://localhost:{PORT}"
HERE       = Path(__file__).parent
FRONTEND   = HERE / "frontend"
IS_WINDOWS = sys.platform == "win32"


def p(msg):
    print(msg)


def check_env():
    missing = [v for v in ("ANTHROPIC_API_KEY", "GITHUB_TOKEN") if not os.environ.get(v)]
    if missing:
        p("WARNING: missing environment variables:")
        for m in missing:
            p(f"  set {m}=your_value_here" if IS_WINDOWS else f"  export {m}=your_value_here")
        p("")


def run_cmd(cmd, cwd=None):
    return subprocess.run(
        cmd, cwd=str(cwd) if cwd else None,
        shell=True, capture_output=True, text=True,
        env=os.environ.copy()
    )


def check_node():
    result = run_cmd("node --version")
    if result.returncode == 0:
        p(f"Node.js found: {result.stdout.strip()}")
        return True
    p("Node.js not found - skipping TypeScript compilation.")
    p("Install from https://nodejs.org to enable TS compilation.")
    return False


def npm_install():
    p("Installing frontend dependencies (npm install)...")
    result = run_cmd("npm install", cwd=FRONTEND)
    if result.returncode != 0:
        p("npm install failed:")
        if result.stdout: p(result.stdout)
        if result.stderr: p(result.stderr)
        return False
    p("npm install OK.")
    return True


def compile_typescript():
    p("Compiling TypeScript...")
    result = run_cmd("npx tsc", cwd=FRONTEND)
    if result.returncode != 0:
        p("TypeScript compilation failed (continuing anyway):")
        if result.stdout: p(result.stdout)
        if result.stderr: p(result.stderr)
    else:
        p("TypeScript compiled OK.")


def wait_for_server(timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(URL + "/health", timeout=1)
            return True
        except Exception:
            time.sleep(0.4)
    return False


p("=== Claudeius ===")
check_env()

if check_node():
    if npm_install():
        compile_typescript()

p(f"Starting server on {URL} ...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "main:app", "--port", str(PORT), "--reload"],
    cwd=str(HERE / "backend"),
)

if wait_for_server():
    p("Ready! Opening browser...\n")
    webbrowser.open(URL)
else:
    p(f"Server slow to start - open {URL} manually.\n")

p("Press Ctrl+C to stop.\n")
try:
    proc.wait()
except KeyboardInterrupt:
    p("\nStopping...")
    proc.terminate()
    proc.wait()
    p("Done.")
except Exception as e:
    p(f"\nError: {e}")
    proc.terminate()
    input("\nPress Enter to close...")
