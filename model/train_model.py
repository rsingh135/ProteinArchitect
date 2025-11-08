"""
Protein-Protein Interaction (PPI) Prediction Model Training
Trains a model on HINT dataset to predict protein-protein interactions
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
import pickle
import os
from tqdm import tqdm
import logging
from typing import Dict, List, Tuple, Optional
import requests
from io import StringIO

# Try to import ESM - will fail gracefully if not installed
try:
    import esm
    ESM_AVAILABLE = True
except ImportError:
    ESM_AVAILABLE = False
    print("Warning: ESM not installed. Install with: pip install fair-esm")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PPIDataset(Dataset):
    """Dataset for Protein-Protein Interaction prediction"""
    
    def __init__(self, pairs: List[Tuple[str, str]], labels: List[int], 
                 embeddings_cache: Dict[str, torch.Tensor], 
                 max_length: int = 1024):
        """
        Args:
            pairs: List of (protein_id_A, protein_id_B) tuples
            labels: List of interaction labels (1 = interacts, 0 = doesn't interact)
            embeddings_cache: Dictionary mapping protein_id to embedding tensor
            max_length: Maximum sequence length for embedding
        """
        self.pairs = pairs
        self.labels = labels
        self.embeddings_cache = embeddings_cache
        self.max_length = max_length
    
    def __len__(self):
        return len(self.pairs)
    
    def __getitem__(self, idx):
        protein_a, protein_b = self.pairs[idx]
        label = self.labels[idx]
        
        # Get embeddings (use zero vector if not found)
        emb_a = self.embeddings_cache.get(protein_a, torch.zeros(1280))  # ESM2-650M embedding size
        emb_b = self.embeddings_cache.get(protein_b, torch.zeros(1280))
        
        # Concatenate embeddings
        combined_emb = torch.cat([emb_a, emb_b])
        
        return {
            'embedding': combined_emb,
            'label': torch.tensor(label, dtype=torch.float32),
            'protein_a': protein_a,
            'protein_b': protein_b
        }


class PPIPredictor(nn.Module):
    """Neural network for predicting protein-protein interactions"""
    
    def __init__(self, input_dim: int = 2560, hidden_dims: List[int] = [512, 256, 128], 
                 num_interaction_types: int = 5, dropout: float = 0.3):
        """
        Args:
            input_dim: Input dimension (2 * embedding_size)
            hidden_dims: List of hidden layer dimensions
            num_interaction_types: Number of interaction type classes
            dropout: Dropout probability
        """
        super(PPIPredictor, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        # Build hidden layers
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        self.feature_extractor = nn.Sequential(*layers)
        
        # Binary classification head (interacts or not)
        self.binary_classifier = nn.Sequential(
            nn.Linear(prev_dim, 1),
            nn.Sigmoid()
        )
        
        # Interaction type classifier (optional)
        self.type_classifier = nn.Sequential(
            nn.Linear(prev_dim, num_interaction_types),
            nn.Softmax(dim=1)
        )
    
    def forward(self, x):
        features = self.feature_extractor(x)
        binary_prob = self.binary_classifier(features)
        interaction_type = self.type_classifier(features)
        return binary_prob, interaction_type


def load_hint_dataset(file_path: str) -> pd.DataFrame:
    """Load HINT dataset from TSV file"""
    logger.info(f"Loading HINT dataset from {file_path}")
    df = pd.read_csv(file_path, sep='\t')
    logger.info(f"Loaded {len(df)} protein pairs")
    return df


def get_protein_sequence(uniprot_id: str) -> Optional[str]:
    """Fetch protein sequence from UniProt API"""
    try:
        url = f"https://www.uniprot.org/uniprot/{uniprot_id}.fasta"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Parse FASTA format
            lines = response.text.strip().split('\n')
            sequence = ''.join(lines[1:])  # Skip header line
            return sequence
        else:
            logger.warning(f"Failed to fetch sequence for {uniprot_id}: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching sequence for {uniprot_id}: {e}")
        return None


def generate_negative_samples(positive_pairs: List[Tuple[str, str]], 
                             all_proteins: set, 
                             num_negatives: int) -> List[Tuple[str, str]]:
    """Generate negative samples by randomly pairing proteins not in positive set"""
    negative_pairs = []
    proteins_list = list(all_proteins)
    
    # Create set of positive pairs for fast lookup
    positive_set = set(positive_pairs)
    
    attempts = 0
    max_attempts = num_negatives * 10
    
    while len(negative_pairs) < num_negatives and attempts < max_attempts:
        # Randomly select two different proteins
        protein_a = np.random.choice(proteins_list)
        protein_b = np.random.choice(proteins_list)
        
        # Ensure they're different
        if protein_a == protein_b:
            attempts += 1
            continue
        
        # Create pair (normalize order for comparison)
        pair = tuple(sorted([protein_a, protein_b]))
        
        # Check if this pair is not in positive set
        if pair not in positive_set and pair not in negative_pairs:
            negative_pairs.append(pair)
        
        attempts += 1
    
    logger.info(f"Generated {len(negative_pairs)} negative samples")
    return negative_pairs


def compute_esm_embeddings(protein_ids: List[str], 
                          sequences: Dict[str, str],
                          model_name: str = "facebook/esm2_t33_650M_UR50D",
                          batch_size: int = 8,
                          device: str = "cuda" if torch.cuda.is_available() else "cpu") -> Dict[str, torch.Tensor]:
    """Compute ESM2 embeddings for proteins"""
    if not ESM_AVAILABLE:
        logger.error("ESM not available. Install with: pip install fair-esm")
        return {}
    
    logger.info(f"Computing ESM embeddings for {len(protein_ids)} proteins")
    logger.info(f"Using device: {device}")
    
    # Load ESM model
    model, alphabet = esm.pretrained.load_model_and_alphabet_hub(model_name)
    model = model.to(device)
    model.eval()
    
    batch_converter = alphabet.get_batch_converter()
    embeddings = {}
    
    # Process in batches
    for i in tqdm(range(0, len(protein_ids), batch_size), desc="Computing embeddings"):
        batch_ids = protein_ids[i:i+batch_size]
        batch_sequences = []
        valid_ids = []
        
        for pid in batch_ids:
            seq = sequences.get(pid)
            if seq:
                # Truncate if too long
                if len(seq) > 1024:
                    seq = seq[:1024]
                batch_sequences.append(("", seq))  # ESM expects (name, sequence) tuple
                valid_ids.append(pid)
        
        if not batch_sequences:
            continue
        
        # Convert to batch
        batch_labels, batch_strs, batch_tokens = batch_converter(batch_sequences)
        batch_tokens = batch_tokens.to(device)
        
        # Get embeddings (mean pooling over sequence)
        with torch.no_grad():
            results = model(batch_tokens, repr_layers=[33])  # ESM2-650M has 33 layers
            token_embeddings = results["representations"][33]
            
            # Mean pooling (excluding CLS and EOS tokens)
            sequence_embeddings = token_embeddings[:, 1:-1, :].mean(dim=1)
        
        # Store embeddings
        for j, pid in enumerate(valid_ids):
            embeddings[pid] = sequence_embeddings[j].cpu()
    
    logger.info(f"Computed embeddings for {len(embeddings)} proteins")
    return embeddings


def train_model(
    hint_file: str = "HomoSapiens_binary_hq.txt",
    model_save_path: str = "model.pth",
    embeddings_cache_path: str = "embeddings_cache.pkl",
    negative_ratio: float = 1.0,
    test_size: float = 0.2,
    batch_size: int = 32,
    learning_rate: float = 1e-4,
    num_epochs: int = 10,
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
):
    """Train PPI prediction model on HINT dataset"""
    
    logger.info("=" * 60)
    logger.info("Starting PPI Model Training")
    logger.info("=" * 60)
    
    # Load HINT dataset
    df = load_hint_dataset(hint_file)
    
    # Extract positive pairs
    positive_pairs = [(row['Uniprot_A'], row['Uniprot_B']) for _, row in df.iterrows()]
    logger.info(f"Found {len(positive_pairs)} positive pairs")
    
    # Get all unique proteins
    all_proteins = set()
    for pair in positive_pairs:
        all_proteins.add(pair[0])
        all_proteins.add(pair[1])
    logger.info(f"Found {len(all_proteins)} unique proteins")
    
    # Generate negative samples
    num_negatives = int(len(positive_pairs) * negative_ratio)
    negative_pairs = generate_negative_samples(positive_pairs, all_proteins, num_negatives)
    
    # Combine positive and negative pairs
    all_pairs = positive_pairs + negative_pairs
    all_labels = [1] * len(positive_pairs) + [0] * len(negative_pairs)
    
    logger.info(f"Total pairs: {len(all_pairs)} (pos: {len(positive_pairs)}, neg: {len(negative_pairs)})")
    
    # Load or compute embeddings
    if os.path.exists(embeddings_cache_path):
        logger.info(f"Loading embeddings from cache: {embeddings_cache_path}")
        with open(embeddings_cache_path, 'rb') as f:
            embeddings_cache = pickle.load(f)
    else:
        logger.info("Computing embeddings from scratch")
        # Get sequences for all proteins
        sequences = {}
        for protein_id in tqdm(all_proteins, desc="Fetching sequences"):
            seq = get_protein_sequence(protein_id)
            if seq:
                sequences[protein_id] = seq
        
        logger.info(f"Fetched sequences for {len(sequences)} proteins")
        
        # Compute embeddings
        embeddings_cache = compute_esm_embeddings(
            list(all_proteins),
            sequences,
            device=device
        )
        
        # Save embeddings cache
        logger.info(f"Saving embeddings cache to {embeddings_cache_path}")
        with open(embeddings_cache_path, 'wb') as f:
            pickle.dump(embeddings_cache, f)
    
    # Filter out pairs with missing embeddings
    valid_pairs = []
    valid_labels = []
    for pair, label in zip(all_pairs, all_labels):
        if pair[0] in embeddings_cache and pair[1] in embeddings_cache:
            valid_pairs.append(pair)
            valid_labels.append(label)
    
    logger.info(f"Valid pairs with embeddings: {len(valid_pairs)}")
    
    # Split into train and test sets
    train_pairs, test_pairs, train_labels, test_labels = train_test_split(
        valid_pairs, valid_labels, test_size=test_size, random_state=42, stratify=valid_labels
    )
    
    # Create datasets
    train_dataset = PPIDataset(train_pairs, train_labels, embeddings_cache)
    test_dataset = PPIDataset(test_pairs, test_labels, embeddings_cache)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    # Initialize model
    model = PPIPredictor(input_dim=2560)  # 2 * 1280 (ESM2-650M embedding size)
    model = model.to(device)
    
    # Loss and optimizer
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)
    
    # Training loop
    logger.info("Starting training...")
    best_test_loss = float('inf')
    
    for epoch in range(num_epochs):
        # Training
        model.train()
        train_loss = 0.0
        train_preds = []
        train_true = []
        
        for batch in tqdm(train_loader, desc=f"Epoch {epoch+1}/{num_epochs}"):
            embeddings = batch['embedding'].to(device)
            labels = batch['label'].to(device)
            
            optimizer.zero_grad()
            binary_prob, _ = model(embeddings)
            loss = criterion(binary_prob.squeeze(), labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            train_preds.extend(binary_prob.squeeze().detach().cpu().numpy())
            train_true.extend(labels.cpu().numpy())
        
        train_loss /= len(train_loader)
        train_acc = accuracy_score(train_true, [1 if p > 0.5 else 0 for p in train_preds])
        train_auc = roc_auc_score(train_true, train_preds)
        
        # Validation
        model.eval()
        test_loss = 0.0
        test_preds = []
        test_true = []
        
        with torch.no_grad():
            for batch in test_loader:
                embeddings = batch['embedding'].to(device)
                labels = batch['label'].to(device)
                
                binary_prob, _ = model(embeddings)
                loss = criterion(binary_prob.squeeze(), labels)
                
                test_loss += loss.item()
                test_preds.extend(binary_prob.squeeze().cpu().numpy())
                test_true.extend(labels.cpu().numpy())
        
        test_loss /= len(test_loader)
        test_acc = accuracy_score(test_true, [1 if p > 0.5 else 0 for p in test_preds])
        test_auc = roc_auc_score(test_true, test_preds)
        
        scheduler.step(test_loss)
        
        logger.info(f"Epoch {epoch+1}/{num_epochs}:")
        logger.info(f"  Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f}, Train AUC: {train_auc:.4f}")
        logger.info(f"  Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.4f}, Test AUC: {test_auc:.4f}")
        
        # Save best model
        if test_loss < best_test_loss:
            best_test_loss = test_loss
            torch.save({
                'model_state_dict': model.state_dict(),
                'embeddings_cache': embeddings_cache,
                'epoch': epoch,
                'test_loss': test_loss,
                'test_acc': test_acc,
                'test_auc': test_auc
            }, model_save_path)
            logger.info(f"Saved best model to {model_save_path}")
    
    logger.info("Training completed!")
    logger.info(f"Best model saved to {model_save_path}")
    
    # Save embeddings cache separately for inference
    embeddings_save_path = "embeddings_cache.pkl"
    with open(embeddings_save_path, 'wb') as f:
        pickle.dump(embeddings_cache, f)
    logger.info(f"Embeddings cache saved to {embeddings_save_path}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train PPI prediction model")
    parser.add_argument("--hint_file", type=str, default="HomoSapiens_binary_hq.txt",
                       help="Path to HINT dataset file")
    parser.add_argument("--model_save_path", type=str, default="model.pth",
                       help="Path to save trained model")
    parser.add_argument("--embeddings_cache_path", type=str, default="embeddings_cache.pkl",
                       help="Path to embeddings cache file")
    parser.add_argument("--negative_ratio", type=float, default=1.0,
                       help="Ratio of negative to positive samples")
    parser.add_argument("--test_size", type=float, default=0.2,
                       help="Test set size ratio")
    parser.add_argument("--batch_size", type=int, default=32,
                       help="Batch size for training")
    parser.add_argument("--learning_rate", type=float, default=1e-4,
                       help="Learning rate")
    parser.add_argument("--num_epochs", type=int, default=10,
                       help="Number of training epochs")
    parser.add_argument("--device", type=str, default=None,
                       help="Device to use (cuda/cpu)")
    
    args = parser.parse_args()
    
    device = args.device if args.device else ("cuda" if torch.cuda.is_available() else "cpu")
    
    train_model(
        hint_file=args.hint_file,
        model_save_path=args.model_save_path,
        embeddings_cache_path=args.embeddings_cache_path,
        negative_ratio=args.negative_ratio,
        test_size=args.test_size,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        num_epochs=args.num_epochs,
        device=device
    )

