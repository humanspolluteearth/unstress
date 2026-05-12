#!/bin/bash

# Detect target triple
TARGET_TRIPLE=$(rustc -vV | sed -n 's|host: ||p')
OUTPUT_NAME="backend-$TARGET_TRIPLE"
BIN_DIR="../frontend/src-tauri/binaries"

echo "Building sidecar for $TARGET_TRIPLE with PyInstaller..."

# Ensure environment is ready
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Clean previous builds
rm -rf build dist

# Run PyInstaller via python module to ensure venv usage
# --onefile: single executable for distribution
# --hidden-import: ensure all used modules are included
# --collect-all: bundles everything in the package
python3 -m PyInstaller --onefile \
    --name "$OUTPUT_NAME" \
    --collect-all app \
    --collect-all dateutil \
    --hidden-import uvicorn \
    --hidden-import fastapi \
    --hidden-import sqlalchemy \
    --hidden-import psycopg2 \
    --hidden-import dateutil \
    --hidden-import dateutil.relativedelta \
    app/main.py

# Move to Tauri binaries folder
mkdir -p "$BIN_DIR"
cp "dist/$OUTPUT_NAME" "$BIN_DIR/"

echo "Sidecar built and moved to $BIN_DIR/$OUTPUT_NAME"
