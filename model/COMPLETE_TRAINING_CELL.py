"""
COMPLETE TRAINING CELL - Copy this entire cell into your SageMaker notebook
This does everything from scratch: installs dependencies, loads Hugging Face ESM model, and trains
"""

# ============================================================================
# STEP 1: Install All Dependencies
# ============================================================================
print("=" * 80)
print("STEP 1: Installing Dependencies")
print("=" * 80)

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        __import__(package.split('==')[0].split('>=')[0].split('<=')[0])
        print(f"✅ {package} already installed")
    except ImportError:
        print(f"📦 Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])

# Install core dependencies
packages = [
    "torch>=2.0.0",
    "transformers>=4.30.0",
    "fair-esm>=2.0.0",
    "pandas>=2.0.0",
    "numpy>=1.26.0",
    "scikit-learn>=1.3.2",
    "biopython>=1.81",
    "requests>=2.31.0",
    "tqdm>=4.65.0",
]

for package in packages:
    install_package(package)

print("\n✅ All dependencies installed!")
print()

# ============================================================================
# STEP 2: Set Up Environment - Force Hugging Face Model
# ============================================================================
print("=" * 80)
print("STEP 2: Setting Up Environment for Hugging Face ESM")
print("=" * 80)

import os
import torch

# Set device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️  Using device: {device}")

# Verify CUDA if available
if device == "cuda":
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print(f"   CUDA Version: {torch.version.cuda}")
    print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")

# Set environment variable to prefer Hugging Face
os.environ["TRANSFORMERS_OFFLINE"] = "0"
os.environ["HF_HUB_OFFLINE"] = "0"

print("✅ Environment configured")
print()

# ============================================================================
# STEP 3: Download/Verify HINT Dataset
# ============================================================================
print("=" * 80)
print("STEP 3: Checking HINT Dataset")
print("=" * 80)

import pandas as pd
from pathlib import Path

hint_file = "HomoSapiens_binary_hq.txt"

# Check if file exists
if Path(hint_file).exists():
    print(f"✅ Found {hint_file}")
    # Quick check of file
    df_sample = pd.read_csv(hint_file, sep='\t', nrows=5)
    print(f"   Columns: {list(df_sample.columns)}")
    print(f"   Sample rows: {len(df_sample)}")
else:
    print(f"❌ {hint_file} not found!")
    print("   Please ensure the HINT dataset file is in the current directory")
    print("   You can download it from: https://hint.yulab.org/")
    raise FileNotFoundError(f"{hint_file} not found")

print()

# ============================================================================
# STEP 4: Pre-load Hugging Face ESM Model (Force Download if Needed)
# ============================================================================
print("=" * 80)
print("STEP 4: Loading ESM Model from Hugging Face")
print("=" * 80)

from transformers import EsmModel, EsmTokenizer
import torch

model_name = "facebook/esm2_t33_650M_UR50D"

print(f"📥 Loading {model_name} from Hugging Face...")
print("   This may take a few minutes on first run (downloading ~1.3 GB)...")

try:
    # Load tokenizer
    print("   Loading tokenizer...")
    tokenizer = EsmTokenizer.from_pretrained(model_name)
    print("   ✅ Tokenizer loaded")
    
    # Load model
    print("   Loading model (this may take a while)...")
    hf_model = EsmModel.from_pretrained(model_name)
    hf_model = hf_model.to(device)
    hf_model.eval()
    print("   ✅ Model loaded")
    
    # Test model
    print("   Testing model...")
    test_sequence = "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL")
    test_tokens = tokenizer(test_sequence, return_tensors="pt", padding=True, truncation=True, max_length=1024)
    test_tokens = {k: v.to(device) for k, v in test_tokens.items()}
    
    with torch.no_grad():
        outputs = hf_model(**test_tokens)
        embeddings = outputs.last_hidden_state.mean(dim=1)
    
    print(f"   ✅ Model test successful! Embedding shape: {embeddings.shape}")
    print(f"   ✅ ESM model is ready to use")
    
except Exception as e:
    print(f"   ❌ Error loading model: {e}")
    raise

print()

# ============================================================================
# STEP 5: Modify train_model.py to Use Hugging Face (if needed)
# ============================================================================
print("=" * 80)
print("STEP 5: Preparing Training Script")
print("=" * 80)

# Check if train_model.py exists
if not Path("train_model.py").exists():
    print("❌ train_model.py not found!")
    print("   Please ensure train_model.py is in the current directory")
    raise FileNotFoundError("train_model.py not found")

print("✅ train_model.py found")
print("   The script will automatically use Hugging Face model if ESM download fails")
print()

# ============================================================================
# STEP 6: Run Training
# ============================================================================
print("=" * 80)
print("STEP 6: Starting Training")
print("=" * 80)
print()

# Import the training function
import importlib.util
spec = importlib.util.spec_from_file_location("train_model", "train_model.py")
train_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(train_module)

# Set training parameters
training_config = {
    "hint_file": hint_file,
    "model_save_path": "model.pth",
    "embeddings_cache_path": "embeddings_cache.pkl",
    "negative_ratio": 1.0,
    "test_size": 0.2,
    "batch_size": 32,
    "learning_rate": 1e-4,
    "num_epochs": 10,
    "device": device,
    "cache_dir": os.path.expanduser("~/.cache/torch/hub/checkpoints"),
}

print("Training Configuration:")
for key, value in training_config.items():
    print(f"   {key}: {value}")
print()

# The train_model.py script will automatically:
# 1. Try to load ESM model (will fail with 403)
# 2. Fall back to Hugging Face transformers (which we've pre-loaded)
# 3. Compute embeddings
# 4. Train the model

print("🚀 Starting training...")
print("   This will:")
print("   1. Load protein sequences from HINT dataset")
print("   2. Compute ESM embeddings (using Hugging Face model)")
print("   3. Generate negative samples")
print("   4. Train the PPI prediction model")
print("   5. Save model.pth and embeddings_cache.pkl")
print()
print("   ⏱️  Estimated time: 2-6 hours (depending on GPU)")
print()

# Run training
try:
    train_module.train_model(**training_config)
    print()
    print("=" * 80)
    print("✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print()
    print("📁 Output files:")
    print("   - model.pth (trained model)")
    print("   - embeddings_cache.pkl (cached embeddings)")
    print()
    print("🎉 Next steps:")
    print("   1. Upload model.pth to S3")
    print("   2. Deploy to SageMaker endpoint")
    print("   3. Use for PPI predictions")
    print()
except Exception as e:
    print()
    print("=" * 80)
    print("❌ TRAINING FAILED")
    print("=" * 80)
    print(f"Error: {e}")
    print()
    print("Please check the error message above and try again")
    raise

