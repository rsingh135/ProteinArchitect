# 🔧 Installation Fix Guide

## Problem
Python 3.13 is very new and some older package versions don't have pre-built wheels, causing build errors.

## Solution Options

### Option 1: Use Python 3.11 or 3.12 (Recommended for Hackathon)
Python 3.11/3.12 have better package compatibility and are more stable.

```bash
# Check if you have Python 3.11 or 3.12 installed
python3.11 --version
python3.12 --version

# If available, create venv with Python 3.11
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Option 2: Use Updated Requirements (Python 3.13)
The requirements.txt has been updated to use newer package versions that support Python 3.13.

```bash
cd backend

# Remove old venv if it exists
rm -rf venv .venv

# Create new venv
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip and install build tools first
pip install --upgrade pip setuptools wheel

# Install dependencies
pip install -r requirements.txt
```

### Option 3: Install Setuptools First (Quick Fix)
If you want to keep your current venv, install setuptools first:

```bash
cd backend
source venv/bin/activate  # Activate your existing venv
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## Verification

After installation, verify everything works:

```bash
# Test imports
python -c "import fastapi; import numpy; import openai; print('All imports successful!')"

# Start server
uvicorn main:app --reload --port 8000
```

## If Issues Persist

1. **Clear pip cache:**
   ```bash
   pip cache purge
   ```

2. **Install packages one by one to identify problematic ones:**
   ```bash
   pip install fastapi uvicorn pydantic
   pip install numpy
   pip install scikit-learn
   pip install openai boto3 httpx
   pip install python-dotenv biopython
   ```

3. **Use Python 3.11/3.12** (most reliable for hackathon):
   ```bash
   # Install Python 3.11 via Homebrew (macOS)
   brew install python@3.11
   
   # Then create venv with Python 3.11
   python3.11 -m venv venv
   ```

## Quick Start (Recommended)

For the hackathon, I recommend using Python 3.11 for maximum compatibility:

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

