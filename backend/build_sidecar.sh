#!/bin/bash

# Detect target triple
TARGET_TRIPLE=$(rustc -vV | sed -n 's|host: ||p')
OUTPUT_NAME="backend-$TARGET_TRIPLE"
BIN_DIR="../frontend/src-tauri/binaries"

echo "Building sidecar for $TARGET_TRIPLE..."

# Ensure Nuitka is installed in venv
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt nuitka
else
    source .venv/bin/activate
    pip install nuitka
fi

# Run Nuitka
# --standalone: bundle all dependencies
# --onefile: single executable for distribution
# --include-package: ensure fastapi and uvicorn are bundled correctly
python3 -m nuitka \
    --standalone \
    --onefile \
    --include-package=app \
    --output-dir=dist \
    --output-filename="$OUTPUT_NAME" \
    app/main.py

# Move to Tauri binaries folder
mkdir -p "$BIN_DIR"
cp "dist/$OUTPUT_NAME" "$BIN_DIR/"

echo "Sidecar built and moved to $BIN_DIR/$OUTPUT_NAME"
