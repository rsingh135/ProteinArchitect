#!/usr/bin/env python3
"""
Quick check script to verify backend can start
"""

import sys
import os

def check_backend():
    print("=" * 60)
    print("Backend Health Check")
    print("=" * 60)
    print()
    
    # Check 1: Are we in the right directory?
    if not os.path.exists("main.py"):
        print("[ERROR] main.py not found!")
        print(f"   Current directory: {os.getcwd()}")
        print("   Please run from the backend directory")
        return False
    print("[OK] Found main.py")
    
    # Check 2: Can we import FastAPI?
    try:
        import fastapi
        print("[OK] FastAPI is installed")
    except ImportError:
        print("[ERROR] FastAPI not installed")
        print("   Run: pip install fastapi uvicorn[standard]")
        return False
    
    # Check 3: Can we import uvicorn?
    try:
        import uvicorn
        print("[OK] Uvicorn is installed")
    except ImportError:
        print("[ERROR] Uvicorn not installed")
        print("   Run: pip install uvicorn[standard]")
        return False
    
    # Check 4: Can we import main?
    try:
        import main
        print("[OK] main.py imports successfully")
    except Exception as e:
        print(f"[ERROR] Error importing main.py: {e}")
        return False
    
    # Check 5: Is port 8000 available?
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 8000))
    sock.close()
    
    if result == 0:
        print("[WARNING] Port 8000 is already in use")
        print("   Another process may be using it")
    else:
        print("[OK] Port 8000 is available")
    
    # Check 6: Environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    dedalus_key = os.getenv("DEDALUS_API_KEY")
    if dedalus_key:
        print("[OK] DEDALUS_API_KEY is set")
    else:
        print("[WARNING] DEDALUS_API_KEY not set (optional for basic functionality)")
    
    print()
    print("=" * 60)
    print("[OK] Backend is ready to start!")
    print("=" * 60)
    print()
    print("To start the backend, run:")
    print("  python run_backend_simple.py")
    print()
    print("Or from the root directory:")
    print("  npm run backend")
    print("  npm start  (starts both frontend and backend)")
    print()
    
    return True

if __name__ == "__main__":
    success = check_backend()
    sys.exit(0 if success else 1)

