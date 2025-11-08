#!/bin/bash

# Protein Architect Backend Installation Script
# This script handles Python 3.13 compatibility issues

echo "🧬 Protein Architect - Backend Installation"
echo "==========================================="
echo ""

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Detected Python version: $PYTHON_VERSION"

# Check if Python 3.11 or 3.12 is available (better compatibility)
if command -v python3.11 &> /dev/null; then
    echo "✓ Python 3.11 found - recommended for better package compatibility"
    PYTHON_CMD="python3.11"
elif command -v python3.12 &> /dev/null; then
    echo "✓ Python 3.12 found - good compatibility"
    PYTHON_CMD="python3.12"
else
    echo "⚠ Using Python 3.13 - some packages may need to build from source"
    PYTHON_CMD="python3"
fi

# Remove old venv if exists
if [ -d "venv" ] || [ -d ".venv" ]; then
    echo ""
    echo "Removing old virtual environment..."
    rm -rf venv .venv
fi

# Create virtual environment
echo ""
echo "Creating virtual environment with $PYTHON_CMD..."
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip and install build tools
echo ""
echo "Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo ""
echo "Installing dependencies (this may take a few minutes)..."
pip install -r requirements.txt

# Verify installation
echo ""
echo "Verifying installation..."
python -c "import fastapi; import numpy; import openai; print('✓ All core packages imported successfully!')" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation successful!"
    echo ""
    echo "To start the server:"
    echo "  source venv/bin/activate"
    echo "  uvicorn main:app --reload --port 8000"
else
    echo ""
    echo "❌ Installation verification failed. Please check the errors above."
    echo ""
    echo "Troubleshooting:"
    echo "  1. Try using Python 3.11: python3.11 -m venv venv"
    echo "  2. Install packages individually to identify issues"
    echo "  3. Check INSTALL_FIX.md for more solutions"
fi

