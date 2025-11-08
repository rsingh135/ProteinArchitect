# ⚡ Quick Fix: "No module named 'torch'"

## Run This Now (Copy & Paste)

```bash
cd model
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio
pip install -r requirements.txt
python -c "import torch; print('PyTorch installed!')"
```

## Then Test Training

```bash
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 1 --device cpu --batch_size 4
```

## That's It!

If this works, you're ready to train. See `TRAINING_GUIDE.md` for full training instructions.
