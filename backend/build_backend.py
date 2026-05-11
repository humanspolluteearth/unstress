import os
import sys
import subprocess
import shutil

def get_target_triple():
    """Detects the host target triple using rustc."""
    try:
        output = subprocess.check_output(["rustc", "-vV"], text=True)
        for line in output.splitlines():
            if line.startswith("host:"):
                return line.split(":")[1].strip()
    except Exception:
        # Fallback for standard Arch Linux x86_64 systems
        return "x86_64-unknown-linux-gnu"

def build():
    triple = get_target_triple()
    # Tauri expects the binary to be named <name>-<target-triple>
    output_name = f"backend-{triple}"
    bin_dir = os.path.join("..", "frontend", "src-tauri", "binaries")
    
    print(f"--- [Sidecar Build] Starting for {triple} ---")
    
    # Ensure binaries directory exists in Tauri folder
    os.makedirs(bin_dir, exist_ok=True)
    
    # PyInstaller Command
    # --onefile: Bundles everything into a single executable
    # --name: Specifies the output binary name
    # --hidden-import: Ensures uvicorn and other dynamic dependencies are included
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--name", output_name,
        "--clean",
        "--distpath", "dist",
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "app/main.py"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        
        # Verify and Move
        src_path = os.path.join("dist", output_name)
        dest_path = os.path.join(bin_dir, output_name)
        
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"--- [Sidecar Build] Success: {dest_path} ---")
        else:
            print(f"--- [Sidecar Build] Error: Binary not found at {src_path} ---")
            sys.exit(1)
            
    except subprocess.CalledProcessError as e:
        print(f"--- [Sidecar Build] PyInstaller failed: {e} ---")
        sys.exit(1)

if __name__ == "__main__":
    build()
