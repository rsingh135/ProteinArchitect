#!/usr/bin/env python3
"""
Simple backend runner - just start the server
No virtual environment management, just run it
Can be called from npm scripts
"""

import sys
import subprocess
import os

def main():
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check if we're in the right directory
    if not os.path.exists("main.py"):
        print("ERROR: main.py not found!")
        print(f"Current directory: {os.getcwd()}")
        print("Please run this script from the backend directory.")
        sys.exit(1)
    
    # Check if uvicorn is available
    try:
        import uvicorn
    except ImportError:
        print("Installing uvicorn...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn[standard]", "fastapi", "-q"])
        import uvicorn
    
    # Start the server (quiet mode for npm)
    try:
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

