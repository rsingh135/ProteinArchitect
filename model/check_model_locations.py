#!/usr/bin/env python3
"""
Check where ESM model is located (PyTorch Hub vs Hugging Face)
"""

import os
from pathlib import Path

def check_model_locations():
    """Check both PyTorch Hub and Hugging Face cache locations"""
    
    print("=" * 60)
    print("Checking ESM Model Locations")
    print("=" * 60)
    
    # Check PyTorch Hub location (what ESM library expects)
    pt_cache = Path.home() / ".cache" / "torch" / "hub" / "checkpoints"
    pt_file = pt_cache / "esm2_t33_650M_UR50D.pt"
    
    print("\n1. PyTorch Hub Location (ESM library expects this):")
    print(f"   Path: {pt_file}")
    if pt_file.exists():
        size_gb = pt_file.stat().st_size / (1024**3)
        if size_gb > 1.0:
            print(f"   ✅ Found: {size_gb:.2f} GB")
            print(f"   ✅ This is what ESM library needs!")
        else:
            print(f"   ⚠️  Found but size is wrong: {size_gb:.2f} GB")
            print(f"   ❌ File may be corrupted or incomplete")
    else:
        print(f"   ❌ Not found")
        print(f"   📋 You need to download the .pt file here")
    
    # Check Hugging Face location
    hf_cache = Path.home() / ".cache" / "huggingface" / "hub"
    model_dirs = list(hf_cache.glob("models--facebook--esm2_t33_650M_UR50D*"))
    
    print("\n2. Hugging Face Location (transformers library):")
    if model_dirs:
        print(f"   ✅ Found {len(model_dirs)} model directory(ies):")
        for model_dir in model_dirs:
            print(f"   📁 {model_dir.name}")
            
            # Check for model files
            safetensors_files = list(model_dir.rglob("*.safetensors"))
            pytorch_files = list(model_dir.rglob("*.bin"))
            config_files = list(model_dir.rglob("config.json"))
            
            total_size = 0
            if safetensors_files:
                for f in safetensors_files:
                    size_gb = f.stat().st_size / (1024**3)
                    total_size += size_gb
                    print(f"      📄 {f.name}: {size_gb:.2f} GB")
            
            if pytorch_files:
                for f in pytorch_files:
                    size_gb = f.stat().st_size / (1024**3)
                    total_size += size_gb
                    print(f"      📄 {f.name}: {size_gb:.2f} GB")
            
            if config_files:
                print(f"      📄 config.json: Found")
            
            if total_size > 0:
                print(f"   📊 Total size: {total_size:.2f} GB")
            
            print(f"   ⚠️  This is Hugging Face format (not PyTorch Hub)")
            print(f"   ⚠️  ESM library can't use this directly")
    else:
        print(f"   ❌ Not found")
        print(f"   📋 Hugging Face cache: {hf_cache}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    if pt_file.exists() and pt_file.stat().st_size / (1024**3) > 1.0:
        print("✅ PyTorch Hub model found - ESM library can use it!")
        print("✅ You're ready to train!")
    elif model_dirs:
        print("⚠️  Hugging Face model found, but PyTorch Hub model missing")
        print("📋 Solution: Download the .pt file to PyTorch Hub location")
        print("   Run the download cell in your notebook")
    else:
        print("❌ No model found in either location")
        print("📋 Solution: Download the model first")

if __name__ == "__main__":
    check_model_locations()

