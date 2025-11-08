# 🚀 Model Training Guide - Step by Step

## Prerequisites

- Python 3.9+ (Python 3.11 recommended)
- CUDA-capable GPU (for faster training) OR CPU (slower but works)
- At least 16GB RAM
- 50GB+ free disk space (for embeddings cache)

## Option 1: Local Training (For Testing)

### Step 1: Set Up Environment

```bash
# Navigate to model directory
cd model

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

### Step 2: Install PyTorch

**For CPU (slower, but works everywhere)**:
```bash
pip install torch torchvision torchaudio
```

**For GPU (much faster, requires NVIDIA GPU with CUDA)**:
```bash
# Check your CUDA version first
nvidia-smi

# Install PyTorch with CUDA 11.8 (common)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# OR for CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

**Verify PyTorch Installation**:
```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
```

### Step 3: Install Other Dependencies

```bash
# Install all requirements
pip install -r requirements.txt

# If fair-esm fails, try:
pip install fair-esm --no-cache-dir

# Verify ESM installation
python -c "import esm; print('ESM installed successfully')"
```

### Step 4: Prepare Dataset

```bash
# Make sure HINT dataset is in the model directory
ls -lh HomoSapiens_binary_hq.txt

# If not, download it:
# Go to https://hint.yulab.org/
# Download "Homo sapiens" binary file
# Place it in the model/ directory
```

### Step 5: Run Training (Small Test First)

**For CPU (will be slow)**:
```bash
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 0.1 \
  --test_size 0.2 \
  --batch_size 8 \
  --num_epochs 2 \
  --device cpu
```

**For GPU**:
```bash
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --test_size 0.2 \
  --batch_size 32 \
  --num_epochs 10 \
  --device cuda
```

### Step 6: Monitor Training

Training will:
1. Load HINT dataset
2. Generate negative samples
3. Fetch protein sequences from UniProt
4. Compute ESM2 embeddings (this takes the longest time)
5. Train the model
6. Save model and embeddings cache

**Expected Time**:
- CPU: 10-50 hours (depending on dataset size)
- GPU: 2-20 hours (much faster)

## Option 2: AWS EC2 Training (Recommended for Hackathon)

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console: https://console.aws.amazon.com/ec2/
2. Click "Launch Instances"
3. Configure:
   - **Name**: `protein-ppi-training`
   - **AMI**: "Deep Learning AMI (Ubuntu 20.04)" or "Deep Learning AMI (Amazon Linux 2)"
   - **Instance Type**: 
     - `g4dn.xlarge` (cheaper, 1 GPU)
     - `g5.xlarge` (faster, 1 GPU)
     - `p3.2xlarge` (best, but expensive)
   - **Storage**: 100 GB (for dataset and embeddings)
   - **Security Group**: Allow SSH (port 22) from your IP
4. Launch with key pair (save the `.pem` file!)

### Step 2: Connect to EC2

```bash
# On your local machine
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
# OR for Amazon Linux
ssh -i "your-key.pem" ec2-user@<your-ec2-public-ip>
```

### Step 3: Activate PyTorch Environment

The Deep Learning AMI comes with pre-installed environments. Check which ones are available:

```bash
# List available conda environments
conda env list

# Activate PyTorch environment (common names):
source activate pytorch_latest_p39
# OR
conda activate pytorch_latest_p39
# OR
source activate pytorch

# Verify PyTorch and CUDA
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"
```

### Step 4: Install Additional Dependencies

```bash
# Install ESM and other packages
pip install fair-esm biopython requests pandas scikit-learn tqdm

# Verify installation
python -c "import esm; print('ESM installed')"
```

### Step 5: Upload Training Files

**Option A: Using SCP (from your local machine)**:
```bash
# On your local machine
cd /Users/ranveersingh/GenLab

# Upload files
scp -i "your-key.pem" model/train_model.py ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/HomoSapiens_binary_hq.txt ubuntu@<ec2-ip>:~/
scp -i "your-key.pem" model/requirements.txt ubuntu@<ec2-ip>:~/
```

**Option B: Using Git (if your repo is on GitHub)**:
```bash
# On EC2 instance
git clone <your-repo-url>
cd GenLab/model
```

### Step 6: Run Training

```bash
# Navigate to directory with files
cd ~

# Run training (this will take hours)
python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --model_save_path model.pth \
  --embeddings_cache_path embeddings_cache.pkl \
  --negative_ratio 1.0 \
  --test_size 0.2 \
  --batch_size 32 \
  --learning_rate 1e-4 \
  --num_epochs 10 \
  --device cuda

# Training will:
# 1. Take 2-20 hours (depending on dataset size)
# 2. Show progress bars
# 3. Save model.pth and embeddings_cache.pkl when done
```

### Step 7: Monitor Training Progress

**Option A: Using `screen` (recommended)**:
```bash
# Start screen session
screen -S training

# Run training
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10

# Detach: Press Ctrl+A, then D
# Reattach: screen -r training
```

**Option B: Using `tmux`**:
```bash
# Start tmux session
tmux new -s training

# Run training
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10

# Detach: Press Ctrl+B, then D
# Reattach: tmux attach -t training
```

**Option C: Using `nohup`**:
```bash
# Run in background and log output
nohup python train_model.py \
  --hint_file HomoSapiens_binary_hq.txt \
  --num_epochs 10 \
  > training.log 2>&1 &

# Check progress
tail -f training.log

# Check if still running
ps aux | grep train_model.py
```

### Step 8: Download Trained Model

Once training completes:

```bash
# On your local machine
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/model.pth ./model/
scp -i "your-key.pem" ubuntu@<ec2-ip>:~/embeddings_cache.pkl ./model/
```

### Step 9: Terminate EC2 Instance

```bash
# On AWS Console, or via CLI:
aws ec2 terminate-instances --instance-ids <instance-id>
```

## Troubleshooting

### Error: "No module named 'torch'"

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Install PyTorch
pip install torch torchvision torchaudio

# Verify
python -c "import torch; print(torch.__version__)"
```

### Error: "No module named 'esm'"

**Solution**:
```bash
# Install ESM
pip install fair-esm

# If it fails, try:
pip install fair-esm --no-cache-dir

# Or install from source:
pip install git+https://github.com/facebookresearch/esm.git
```

### Error: "CUDA out of memory"

**Solution**:
- Reduce batch size: `--batch_size 16` or `--batch_size 8`
- Use CPU: `--device cpu` (slower but works)
- Use smaller model: Edit code to use smaller ESM model

### Error: "Failed to fetch sequence from UniProt"

**Solution**:
- Check internet connection
- UniProt API might be rate-limiting - the script will skip missing sequences
- Training will continue with available sequences

### Training is Too Slow

**Solutions**:
1. Use GPU instead of CPU
2. Reduce dataset size (use first N rows of HINT file)
3. Reduce negative_ratio (e.g., `--negative_ratio 0.5`)
4. Reduce number of epochs for testing
5. Use smaller ESM model (edit code)

### Embeddings Cache is Large

**Solution**:
- Embeddings cache can be 10-50GB
- This is normal and expected
- Make sure you have enough disk space
- You can delete old cache and recompute if needed

## Quick Start (Minimal Test)

For a quick test to verify everything works:

```bash
# 1. Install dependencies
pip install torch pandas numpy scikit-learn tqdm requests biopython fair-esm

# 2. Create a small test dataset (first 100 rows)
head -100 HomoSapiens_binary_hq.txt > test_hint.txt

# 3. Run quick test
python train_model.py \
  --hint_file test_hint.txt \
  --model_save_path test_model.pth \
  --embeddings_cache_path test_embeddings.pkl \
  --negative_ratio 0.1 \
  --batch_size 4 \
  --num_epochs 1 \
  --device cpu

# This should complete in 10-30 minutes and verify everything works
```

## Expected Output

```
🧬 Starting PPI Model Training
============================================================
Loading HINT dataset from HomoSapiens_binary_hq.txt
Loaded 50000 protein pairs
Found 10000 unique proteins
Generated 50000 negative samples
Total pairs: 100000 (pos: 50000, neg: 50000)
Computing embeddings for 10000 proteins...
Computing embeddings: 100%|████████████| 1250/1250 [2:30:00<00:00, 7.2s/it]
Computed embeddings for 10000 proteins
Valid pairs with embeddings: 95000
Starting training...
Epoch 1/10: 100%|████████████| 2968/2968 [15:30<00:00, 3.2it/s]
  Train Loss: 0.4523, Train Acc: 0.7821, Train AUC: 0.8567
  Test Loss: 0.4234, Test Acc: 0.8012, Test AUC: 0.8723
Saved best model to model.pth
...
Training completed!
Best model saved to model.pth
```

## Next Steps

After training completes:
1. ✅ Model saved to `model.pth`
2. ✅ Embeddings cache saved to `embeddings_cache.pkl`
3. ➡️ Proceed to SageMaker deployment (see AWS_DEPLOYMENT_GUIDE.md)

