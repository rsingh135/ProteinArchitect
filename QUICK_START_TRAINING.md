# ⚡ Quick Start: Fix "No module named 'torch'" Error

## Immediate Fix

### Step 1: Install PyTorch

```bash
# Navigate to model directory
cd model

# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install PyTorch
pip install torch torchvision torchaudio

# Verify it works
python -c "import torch; print(f'PyTorch {torch.__version__} installed!')"
```

### Step 2: Install Other Dependencies

```bash
# Install all requirements
pip install -r requirements.txt

# If ESM fails, try:
pip install fair-esm --no-cache-dir
```

### Step 3: Test Training (Small Test)

```bash
# Create a small test dataset (first 100 rows)
head -100 HomoSapiens_binary_hq.txt > test_hint.txt

# Run quick test
python train_model.py \
  --hint_file test_hint.txt \
  --model_save_path test_model.pth \
  --embeddings_cache_path test_embeddings.pkl \
  --negative_ratio 0.1 \
  --batch_size 4 \
  --num_epochs 1 \
  --device cpu

# This should work and verify everything is set up correctly
```

### Step 4: Full Training (When Ready)

```bash
# For CPU (slow but works)
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 8 \
  --num_epochs 10 \
  --device cpu

# For GPU (much faster, if you have one)
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda
```

## Or Use the Install Script

```bash
cd model
./install_dependencies.sh
```

## Common Issues

### Issue: "pip: command not found"
**Fix**: Install pip first
```bash
python3 -m ensurepip --upgrade
```

### Issue: "virtualenv: command not found"
**Fix**: Use built-in venv
```bash
python3 -m venv venv
```

### Issue: "ESM installation fails"
**Fix**: Install without cache
```bash
pip install fair-esm --no-cache-dir
```

### Issue: "Out of memory"
**Fix**: Use CPU or reduce batch size
```bash
python train_model.py --batch_size 4 --device cpu
```

## For AWS EC2 (Recommended)

If local training is too slow, use AWS EC2:

1. Launch EC2 instance with "Deep Learning AMI"
2. PyTorch is already installed!
3. Just install ESM: `pip install fair-esm`
4. Upload your files and run training

See `TRAINING_GUIDE.md` for detailed EC2 instructions.

