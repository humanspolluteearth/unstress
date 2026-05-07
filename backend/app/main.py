#!/usr/bin/env python
import uvicorn
import socket
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.results import Result
from app.core.broker import broker
from app.modules.tasks.listeners import handle_finance_transaction_added
from app.modules.finance.router import router as finance_router

app = FastAPI(title="unstress Backend")

app.include_router(finance_router)

# Standard CORS for Tauri Localhost communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Register all cross-module listeners here to maintain decoupling."""
    broker.subscribe("FINANCE_TRANSACTION_ADDED", handle_finance_transaction_added)
    print("Event Broker initialized: Tasks listening to Finance events.")

@app.get("/health")
async def health_check() -> Result[dict, str]:
    """
    Health check endpoint using the Result Pattern.
    Direct Import used for Result.
    """
    return Result.ok({"status": "healthy", "version": "0.1.0"})

def get_free_port() -> int:
    """Finds a free port on the local machine."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

def start():
    """Entry point for the sidecar executable with dynamic port discovery."""
    try:
        port = get_free_port()
        # The port MUST be printed to stdout so Tauri can capture it
        print(f"PORT:{port}")
        sys.stdout.flush()
        
        uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print(f"ERROR: Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start()
