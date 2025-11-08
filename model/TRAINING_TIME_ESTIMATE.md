# ⏱️ Training Time Estimate for SageMaker Notebook

## Overview

Training time depends on several factors. Here's a realistic breakdown:

---

## Time Breakdown by Component

### 1. **Embedding Computation** (Biggest Bottleneck - 50-80% of total time)

**What happens**: ESM2 model computes embeddings for each unique protein sequence.

**Time factors**:
- **Number of unique proteins**: Typically 5,000-20,000 for HINT dataset
- **Sequence length**: Average ~400-600 amino acids (truncated to 1024 max)
- **GPU speed**: ml.g4dn.xlarge has NVIDIA T4 GPU (good, but not the fastest)
- **Batch size**: Currently set to batch embeddings (default in code)

**Estimated time**:
- **Small dataset** (~5,000 proteins): **2-4 hours**
- **Medium dataset** (~10,000 proteins): **4-8 hours**
- **Large dataset** (~20,000 proteins): **8-16 hours**

**Why it's slow**:
- ESM2-650M is a large transformer model
- Each protein sequence needs to be processed through the model
- First time is slow (no cache), subsequent runs are instant if cache exists

### 2. **Sequence Fetching from UniProt** (Can be slow - 10-20% of total time)

**What happens**: Script fetches protein sequences from UniProt API.

**Time factors**:
- **API rate limits**: UniProt has rate limits (~3 requests/second)
- **Network latency**: Each request takes ~0.3-1 second
- **Number of proteins**: 5,000-20,000 proteins

**Estimated time**:
- **Small dataset** (~5,000 proteins): **30-60 minutes**
- **Medium dataset** (~10,000 proteins): **1-2 hours**
- **Large dataset** (~20,000 proteins): **2-4 hours**

**Note**: This only happens if sequences aren't cached. If you pre-fetch sequences, this step can be skipped.

### 3. **Model Training** (Relatively fast - 5-15% of total time)

**What happens**: Training the MLP classifier on protein pair embeddings.

**Time factors**:
- **Dataset size**: After negative sampling, typically 100,000-400,000 pairs
- **Batch size**: 32 (as set in notebook)
- **Number of epochs**: 10 (as set in notebook)
- **GPU speed**: Training is much faster than embedding computation

**Estimated time**:
- **Small dataset** (~100,000 pairs): **20-40 minutes**
- **Medium dataset** (~200,000 pairs): **40-80 minutes**
- **Large dataset** (~400,000 pairs): **1-2 hours**

**Why it's faster**:
- Embeddings are already computed (cached)
- MLP classifier is much smaller than ESM2
- Batch processing is efficient

### 4. **Negative Sample Generation** (Fast - <1% of total time)

**What happens**: Randomly pairing proteins that don't interact.

**Estimated time**: **<5 minutes** (just pairing logic, no computation)

---

## Total Time Estimates

### Small Dataset (~5,000 unique proteins, ~50,000 pairs)

| Component | Time |
|-----------|------|
| Sequence Fetching | 30-60 min |
| Embedding Computation | 2-4 hours |
| Model Training | 20-40 min |
| **Total** | **3-5 hours** |

### Medium Dataset (~10,000 unique proteins, ~100,000 pairs)

| Component | Time |
|-----------|------|
| Sequence Fetching | 1-2 hours |
| Embedding Computation | 4-8 hours |
| Model Training | 40-80 min |
| **Total** | **6-11 hours** |

### Large Dataset (~20,000 unique proteins, ~200,000 pairs)

| Component | Time |
|-----------|------|
| Sequence Fetching | 2-4 hours |
| Embedding Computation | 8-16 hours |
| Model Training | 1-2 hours |
| **Total** | **11-22 hours** |

---

## Real-World Scenarios

### Scenario 1: First Time Training (No Cache)

**Dataset**: Medium size (~10,000 proteins)
**Total time**: **6-11 hours**

**Breakdown**:
- Sequence fetching: 1-2 hours
- Embedding computation: 4-8 hours
- Training: 40-80 minutes
- Total: **6-11 hours**

### Scenario 2: Retraining (Embeddings Cached)

**Dataset**: Medium size (~10,000 proteins)
**Total time**: **1-2 hours**

**Breakdown**:
- Sequence fetching: Skipped (cached)
- Embedding computation: Skipped (cached)
- Training: 40-80 minutes
- Total: **1-2 hours**

### Scenario 3: Quick Test Run

**Dataset**: Small subset (100-1000 proteins)
**Total time**: **10-30 minutes**

**Breakdown**:
- Sequence fetching: 5-10 minutes
- Embedding computation: 5-15 minutes
- Training: 2-5 minutes
- Total: **10-30 minutes**

---

## Factors That Affect Time

### 1. **Dataset Size** (Biggest Factor)
- More proteins = more embedding computation
- More pairs = longer training
- **Impact**: 2-4x difference between small and large datasets

### 2. **GPU Instance Type**
- **ml.g4dn.xlarge** (NVIDIA T4): Current choice, good balance
- **ml.p3.2xlarge** (NVIDIA V100): 2-3x faster, more expensive
- **ml.p4d.24xlarge** (NVIDIA A100): 4-5x faster, very expensive
- **Impact**: 2-5x speedup with better GPU

### 3. **Batch Size**
- Current: 32 (good balance)
- Larger batch (64, 128): Faster training, more memory
- Smaller batch (16, 8): Slower training, less memory
- **Impact**: 1.5-2x difference

### 4. **Number of Epochs**
- Current: 10 epochs
- More epochs (20, 50): Longer training, potentially better model
- Fewer epochs (5): Faster training, potentially worse model
- **Impact**: Linear (10 epochs = 2x time of 5 epochs)

### 5. **Sequence Length**
- Current: Truncated to 1024 amino acids
- Longer sequences: Slower embedding computation
- Shorter sequences: Faster embedding computation
- **Impact**: 1.5-2x difference

### 6. **Network Speed** (For UniProt API)
- Fast connection: Faster sequence fetching
- Slow connection: Slower sequence fetching
- **Impact**: 1.5-2x difference for sequence fetching

---

## Optimizations to Speed Up Training

### 1. **Pre-fetch Sequences** (Save 1-4 hours)
```python
# Fetch sequences separately and cache them
# Then training script can skip this step
```

### 2. **Use Larger GPU** (Save 2-5 hours)
- Upgrade to `ml.p3.2xlarge` or `ml.p4d.24xlarge`
- Faster embedding computation
- More expensive but much faster

### 3. **Reduce Dataset Size** (Save 2-10 hours)
- Use subset of HINT dataset for testing
- Filter to high-confidence interactions only
- Use smaller negative ratio

### 4. **Reduce Epochs** (Save 1-2 hours)
- Start with 5 epochs instead of 10
- Can always retrain with more epochs later

### 5. **Larger Batch Size** (Save 20-40 minutes)
- Increase batch size to 64 or 128
- Requires more GPU memory
- Faster training

### 6. **Parallel Sequence Fetching** (Save 30-60 minutes)
- Fetch sequences in parallel (with rate limiting)
- Can speed up sequence fetching significantly

---

## Recommended Approach

### For First Training (Testing)

1. **Use small subset**: First 1000-5000 proteins
2. **Quick test**: 1-2 epochs
3. **Estimated time**: **30-60 minutes**
4. **Verify**: Everything works correctly

### For Full Training

1. **Use full dataset**: All proteins in HINT
2. **Full training**: 10 epochs
3. **Estimated time**: **6-11 hours** (medium dataset)
4. **Let it run**: Can close browser, training continues

### For Production Training

1. **Use best GPU**: `ml.p3.2xlarge` or `ml.p4d.24xlarge`
2. **Pre-fetch sequences**: Save 1-4 hours
3. **Full training**: 10-20 epochs
4. **Estimated time**: **3-6 hours** (with optimizations)

---

## Monitoring Progress

### In Jupyter Notebook

The training script shows progress bars:
- **Sequence fetching**: `Fetching sequences: 100%|████| 10000/10000 [30:00<00:00, 5.56it/s]`
- **Embedding computation**: `Computing embeddings: 100%|████| 500/500 [4:00:00<00:00, 28.8s/it]`
- **Training**: `Epoch 1/10: 100%|████| 3125/3125 [15:30<00:00, 3.35it/s]`

### Checkpoints

The script saves:
- **Embeddings cache**: `embeddings_cache.pkl` (saved after embedding computation)
- **Model checkpoints**: `model.pth` (saved after each epoch if improved)

### If Training Stops

- **Embeddings are cached**: Can resume training without recomputing embeddings
- **Model is saved**: Can resume from last checkpoint
- **No data loss**: All progress is saved

---

## Typical Timeline

### Day 1: Setup and Test (1-2 hours)

1. Create notebook instance: 5 minutes
2. Upload files: 5 minutes
3. Install dependencies: 10 minutes
4. Quick test run (small dataset): 30-60 minutes
5. Verify everything works: 10 minutes

### Day 1-2: Full Training (6-11 hours)

1. Start full training: 1 minute
2. Let it run overnight: 6-11 hours
3. Check results next morning: 10 minutes
4. Save to S3: 5 minutes

### Total: **1-2 days** (mostly waiting for training)

---

## Cost Estimate

### ml.g4dn.xlarge: ~$0.736/hour

- **Quick test** (1 hour): **$0.74**
- **Full training** (6-11 hours): **$4.42 - $8.10**
- **With larger GPU** (ml.p3.2xlarge, ~$3.06/hour, 3-6 hours): **$9.18 - $18.36**

**Remember**: Stop the instance when not in use!

---

## Summary

**Most Likely Scenario** (Medium dataset, first time):
- **Total time**: **6-11 hours**
- **Biggest bottleneck**: Embedding computation (4-8 hours)
- **Can close browser**: Training continues in background
- **Cost**: **$4.42 - $8.10**

**Quick Test** (Small dataset):
- **Total time**: **30-60 minutes**
- **Good for**: Verifying everything works
- **Cost**: **$0.37 - $0.74**

**Optimized** (Pre-fetched sequences, larger GPU):
- **Total time**: **3-6 hours**
- **Good for**: Production training
- **Cost**: **$9.18 - $18.36**

---

## Recommendations

1. **Start with quick test**: 30-60 minutes to verify everything works
2. **Then run full training**: 6-11 hours (can run overnight)
3. **Monitor progress**: Check notebook occasionally
4. **Save to S3**: After training completes
5. **Stop instance**: To save costs

Good luck with your training! 🚀

