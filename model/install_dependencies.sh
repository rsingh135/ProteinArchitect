#!/bin/bash

# Quick Install Script for Model Training Dependencies

echo "🔧 Installing Model Training Dependencies..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install PyTorch (CPU version - works everywhere)
echo ""
echo "Installing PyTorch (CPU version)..."
echo "This may take a few minutes..."
pip install torch torchvision torchaudio

# Install other dependencies
echo ""
echo "Installing other dependencies..."
pip install -r requirements.txt

# Verify installation
echo ""
echo "Verifying installation..."
python -c "import torch; print(f'✅ PyTorch {torch.__version__} installed!')" 2>&1
python -c "import esm; print('✅ ESM installed!')" 2>&1 || echo "⚠️  ESM installation failed. Try: pip install fair-esm --no-cache-dir"

echo ""
echo "✅ Installation complete!"
echo ""
echo "To activate the environment:"
echo "  source venv/bin/activate"
echo ""
echo "To run training:"
echo "  python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10"

