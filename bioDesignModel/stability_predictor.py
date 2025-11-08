# biogenesis_model/stability_predictor.py
import torch.nn as nn

class StabilityPredictor(nn.Module):
    """Neural net surrogate for stability prediction."""
    def __init__(self, in_dim=26, hidden=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, 1),
            nn.Sigmoid()
        )
    def forward(self, x):
        return self.net(x)
