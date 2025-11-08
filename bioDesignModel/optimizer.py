# biogenesis_model/optimizer.py
import random, torch, torch.optim as optim
from Bio.SeqUtils.ProtParam import ProteinAnalysis

def compute_features(seq):
    X = ProteinAnalysis(seq)
    return {"instability": X.instability_index(), "hydrophobicity": X.gravy()}

def reward(seq):
    f = compute_features(seq)
    return max(0.0, 1 - f["instability"]/100.0)

def optimize_sequence(seq, predictor, steps=20):
    """RL-like local mutation optimizer to increase stability."""
    opt = optim.Adam(predictor.parameters(), lr=1e-3)
    best_seq = seq
    for step in range(steps):
        s = list(best_seq)
        s[random.randint(0, len(s)-1)] = random.choice("ACDEFGHIKLMNPQRSTVWY")
        s = "".join(s)
        r = reward(s)
        pred = predictor(torch.rand(26))
        loss = (pred - torch.tensor([r])).pow(2).mean()
        opt.zero_grad(); loss.backward(); opt.step()
        if r > reward(best_seq):
            best_seq = s
    return best_seq
