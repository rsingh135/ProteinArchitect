# 🔧 Fix "No module named 'torch'" Error - Quick Fix

## Immediate Solution (5 minutes)

### Step 1: Navigate to Model Directory

```bash
cd /Users/ranveersingh/GenLab/model
```

### Step 2: Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install PyTorch

```bash
# Install PyTorch (CPU version - works everywhere)
pip install torch torchvision torchaudio

# Verify installation
python -c "import torch; print(f'✅ PyTorch {torch.__version__} installed!')"
```

### Step 4: Install Other Dependencies

```bash
# Install from requirements.txt
pip install -r requirements.txt

# If ESM fails, try:
pip install fair-esm --no-cache-dir
```

### Step 5: Test It Works

```bash
# Quick test
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 1 --device cpu --batch_size 4
```

## Or Use the Install Script

```bash
cd model
./install_dependencies.sh
```

## What This Does

1. Creates a virtual environment (isolated Python environment)
2. Installs PyTorch (the ML framework)
3. Installs ESM (for protein embeddings)
4. Installs all other dependencies

## Why This Error Happened

The error "No module named 'torch'" means PyTorch isn't installed in your current Python environment. The script creates a fresh environment and installs everything needed.

## Next Steps

After fixing the error:
1. Test training works (see Step 5 above)
2. Train the full model (see TRAINING_GUIDE.md)
3. Deploy to SageMaker (see AWS_DEPLOYMENT_GUIDE.md)

## Still Having Issues?

**If pip fails**:
```bash
python3 -m ensurepip --upgrade
```

**If virtual environment fails**:
```bash
python3 -m venv venv --system-site-packages
```

**If ESM installation fails**:
```bash
pip install fair-esm --no-cache-dir --no-build-isolation
```

## For AWS EC2 (Easier - PyTorch Already Installed)

If local installation is problematic, use AWS EC2:

1. Launch EC2 with "Deep Learning AMI"
2. PyTorch is already installed!
3. Just run: `pip install fair-esm`
4. Upload your files and train

See `TRAINING_GUIDE.md` for EC2 instructions.

