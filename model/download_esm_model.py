#!/usr/bin/env python3
"""
Direct download script for ESM2 model
This script downloads the model file directly using requests/urllib
to avoid 403 errors from the ESM library.
"""

import os
import urllib.request
import urllib.error
import shutil
from pathlib import Path
from tqdm import tqdm

def download_file(url: str, dest_path: str, chunk_size: int = 8192):
    """Download a file with progress bar"""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        # Get file size for progress bar
        with urllib.request.urlopen(url) as response:
            total_size = int(response.headers.get('Content-Length', 0))
        
        # Download with progress bar
        with urllib.request.urlopen(url) as response, open(dest_path, 'wb') as out_file:
            if total_size > 0:
                with tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading") as pbar:
                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        out_file.write(chunk)
                        pbar.update(len(chunk))
            else:
                shutil.copyfileobj(response, out_file)
        
        return True
    except Exception as e:
        print(f"Error downloading: {e}")
        return False

def download_esm_model():
    """Download ESM2 model directly"""
    model_url = "https://dl.fbaipublicfiles.com/fair-esm/models/facebook/esm2_t33_650M_UR50D.pt"
    
    # Cache directory
    cache_dir = os.path.expanduser("~/.cache/torch/hub/checkpoints")
    os.makedirs(cache_dir, exist_ok=True)
    
    model_file = os.path.join(cache_dir, "esm2_t33_650M_UR50D.pt")
    
    # Check if already downloaded
    if os.path.exists(model_file):
        size_gb = os.path.getsize(model_file) / (1024**3)
        print(f"✅ Model already exists at: {model_file}")
        print(f"   Size: {size_gb:.2f} GB")
        return model_file
    
    print("📥 Downloading ESM2 model...")
    print(f"   URL: {model_url}")
    print(f"   Destination: {model_file}")
    print(f"   This will take 5-10 minutes (~1.3 GB)")
    print("=" * 60)
    
    # Try downloading with different user agents
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Python-urllib/3.10",
    ]
    
    for i, user_agent in enumerate(user_agents, 1):
        try:
            print(f"\nAttempt {i}/{len(user_agents)}: Using user agent...")
            
            # Create request with user agent
            req = urllib.request.Request(model_url)
            req.add_header('User-Agent', user_agent)
            
            # Download
            with urllib.request.urlopen(req) as response, open(model_file, 'wb') as out_file:
                total_size = int(response.headers.get('Content-Length', 0))
                
                if total_size > 0:
                    with tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading") as pbar:
                        while True:
                            chunk = response.read(8192)
                            if not chunk:
                                break
                            out_file.write(chunk)
                            pbar.update(len(chunk))
                else:
                    shutil.copyfileobj(response, out_file)
            
            # Verify download
            if os.path.exists(model_file) and os.path.getsize(model_file) > 1000000000:  # > 1GB
                size_gb = os.path.getsize(model_file) / (1024**3)
                print(f"\n✅ Model downloaded successfully!")
                print(f"   Location: {model_file}")
                print(f"   Size: {size_gb:.2f} GB")
                return model_file
            else:
                print("❌ Downloaded file is too small, may be corrupted")
                if os.path.exists(model_file):
                    os.remove(model_file)
                    
        except urllib.error.HTTPError as e:
            if e.code == 403:
                print(f"❌ 403 Forbidden (attempt {i})")
                if i < len(user_agents):
                    print("   Trying different user agent...")
                    continue
                else:
                    print("\n❌ All download attempts failed with 403")
                    print("\n📋 Alternative solutions:")
                    print("1. Use Hugging Face transformers (see below)")
                    print("2. Download manually from: https://github.com/facebookresearch/esm")
                    print("3. Use S3 bucket with pre-downloaded model")
                    return None
            else:
                print(f"❌ HTTP Error {e.code}: {e.reason}")
                return None
        except Exception as e:
            print(f"❌ Error: {e}")
            if i < len(user_agents):
                print("   Trying again...")
                continue
            return None
    
    return None

def download_from_huggingface():
    """Alternative: Download from Hugging Face"""
    try:
        print("\n🔄 Trying Hugging Face transformers...")
        from transformers import EsmModel, EsmTokenizer
        
        print("Downloading from Hugging Face...")
        model = EsmModel.from_pretrained("facebook/esm2_t33_650M_UR50D")
        tokenizer = EsmTokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D")
        
        print("✅ Model downloaded from Hugging Face!")
        return model, tokenizer
    except ImportError:
        print("❌ transformers library not installed")
        print("   Install with: pip install transformers")
        return None, None
    except Exception as e:
        print(f"❌ Error downloading from Hugging Face: {e}")
        return None, None

if __name__ == "__main__":
    print("=" * 60)
    print("ESM2 Model Downloader")
    print("=" * 60)
    
    # Try direct download first
    model_file = download_esm_model()
    
    if model_file:
        print("\n✅ Model is ready to use!")
        print(f"   Location: {model_file}")
    else:
        print("\n❌ Direct download failed")
        print("\n🔄 Trying Hugging Face...")
        model, tokenizer = download_from_huggingface()
        
        if model:
            print("✅ Model downloaded from Hugging Face!")
            print("   You can now use transformers library to load the model")
        else:
            print("\n❌ All download methods failed")
            print("\n📋 Manual download instructions:")
            print("1. Go to: https://github.com/facebookresearch/esm")
            print("2. Download model manually")
            print("3. Place in: ~/.cache/torch/hub/checkpoints/esm2_t33_650M_UR50D.pt")
            print("4. Or use S3 bucket with pre-downloaded model")

