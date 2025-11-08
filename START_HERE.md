# 🚀 START HERE - Quick Reference Guide

## Current Issue: "No module named 'torch'"

### Immediate Fix (5 minutes)

```bash
cd model
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio
pip install -r requirements.txt
python -c "import torch; print('PyTorch installed!')"
```

**That's it!** Now you can train the model.

---

## Complete Workflow

### 1. Train Model ⏱️ 2-20 hours

**Local (Slow)**:
```bash
cd model
source venv/bin/activate
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10 --device cpu
```

**AWS EC2 (Fast, Recommended)**:
- Launch EC2 with "Deep Learning AMI"
- PyTorch already installed!
- Upload files and train
- See `TRAINING_GUIDE.md` for details

### 2. Deploy to SageMaker ⏱️ 30 minutes

1. Build Docker image: `docker build -t protein-ppi-service .`
2. Push to ECR: Follow `AWS_DEPLOYMENT_GUIDE.md`
3. Upload model to S3
4. Create SageMaker model, endpoint config, and endpoint
5. Wait for endpoint to be "InService"

### 3. Set Environment Variables ⏱️ 5 minutes

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
# - GEMINI_API_KEY (required)
# - AWS credentials (for SageMaker)
# - SAGEMAKER_PPI_ENDPOINT
```

### 4. Integrate Frontend ⏱️ 5 minutes

✅ **Already done!** The frontend is already integrated.
- Just start backend and frontend
- Click "PPI Prediction" tab
- Test the workflow

---

## Quick Command Reference

### Fix PyTorch
```bash
cd model && ./install_dependencies.sh
```

### Train Model
```bash
python train_model.py --hint_file HomoSapiens_binary_hq.txt --num_epochs 10
```

### Deploy to SageMaker
```bash
# See AWS_DEPLOYMENT_GUIDE.md
docker build -t protein-ppi-service .
# ... (follow guide)
```

### Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env
```

### Start Application
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## Detailed Guides

- **`QUICK_FIX.md`** - Fix torch error immediately
- **`TRAINING_GUIDE.md`** - Detailed training instructions
- **`AWS_DEPLOYMENT_GUIDE.md`** - SageMaker deployment
- **`COMPLETE_STEP_BY_STEP.md`** - Everything in one place
- **`FRONTEND_INTEGRATION.md`** - Frontend setup (already done!)

---

## Next Steps

1. ✅ Fix PyTorch: `cd model && ./install_dependencies.sh`
2. ✅ Train model: See `TRAINING_GUIDE.md`
3. ✅ Deploy to SageMaker: See `AWS_DEPLOYMENT_GUIDE.md`
4. ✅ Configure: `cp backend/.env.example backend/.env` and edit
5. ✅ Test: Start backend and frontend, test workflow

---

## Need Help?

- **Training issues**: See `TRAINING_GUIDE.md`
- **Deployment issues**: See `AWS_DEPLOYMENT_GUIDE.md`
- **Configuration issues**: See top of `README.md`
- **Security**: See `SECURITY.md`

Good luck! 🚀

