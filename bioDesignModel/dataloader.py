# biogenesis_model/dataloader.py
"""
DataLoader Module for BioDesignModel
-------------------------------------
Provides functionality to:
- Fetch protein data from UniProt
- Create Hugging Face Datasets
- Tokenize protein sequences
- Create PyTorch DataLoaders for training
"""

import requests
import pandas as pd
import io
import logging
from urllib.parse import quote
from typing import Optional, Dict, List
from datasets import Dataset
from torch.utils.data import DataLoader
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


def fetch_uniprot(
    query: str = "reviewed:true AND length:[50 TO 1000]",
    size: int = 500,
    fields: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Fetch protein data from UniProt API.
    
    Args:
        query: UniProt query string (default: reviewed proteins with length 50-1000)
        size: Number of results to fetch
        fields: Additional fields to fetch (e.g., ['organism', 'ec', 'keywords'])
    
    Returns:
        DataFrame with columns: 'function', 'sequence', and any additional fields
    """
    if fields is None:
        # Use standard UniProt field names
        fields = ["accession", "sequence", "cc_function"]
    
    fields_str = ",".join(fields)
    # Properly encode the query and build URL
    encoded_query = quote(query)
    # Use the simpler API endpoint format
    url = f"https://rest.uniprot.org/uniprotkb/search?query={encoded_query}&format=tsv&fields={fields_str}&size={size}"
    
    # Debug: print URL for troubleshooting (comment out in production)
    # logger.debug(f"UniProt URL: {url}")
    
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text), sep="\t")
        
        # Standardize column names
        column_mapping = {
            "Function [CC]": "function",
            "Function": "function",
            "cc_function": "function",
            "Sequence": "sequence",
            "Entry": "id",
            "accession": "id"
        }
        # Only rename columns that exist
        existing_cols = {k: v for k, v in column_mapping.items() if k in df.columns}
        if existing_cols:
            df = df.rename(columns=existing_cols)
        
        # Drop rows with missing essential data
        df = df.dropna(subset=["function", "sequence"])
        
    logger.info(f"Fetched {len(df)} proteins from UniProt")
        return df
    
    except requests.RequestException as e:
        logger.error(f"Error fetching UniProt data: {e}")
        raise
    except Exception as e:
        logger.error(f"Error processing UniProt data: {e}")
        raise


def create_protein_dataset(
    query: str = "reviewed:true AND length:[50 TO 1000]",
    size: int = 500,
    fields: Optional[List[str]] = None,
    cache_dir: Optional[str] = None
) -> Dataset:
    """
    Create a Hugging Face Dataset from UniProt data.
    
    Args:
        query: UniProt query string
        size: Number of proteins to fetch
        fields: Additional UniProt fields to include
        cache_dir: Directory to cache the dataset
    
    Returns:
        Hugging Face Dataset with 'function' and 'sequence' columns
    """
    df = fetch_uniprot(query=query, size=size, fields=fields)
    
    # Ensure we have the required columns
    if "function" not in df.columns or "sequence" not in df.columns:
        raise ValueError("Dataset must contain 'function' and 'sequence' columns")
    
    # Convert to Hugging Face Dataset
    dataset = Dataset.from_pandas(df[["function", "sequence"]])
    
    if cache_dir:
        dataset.save_to_disk(cache_dir)
        logger.info(f"Dataset cached to {cache_dir}")
    
    return dataset


def create_dataloader(
    dataset: Dataset,
    tokenizer: AutoTokenizer,
    batch_size: int = 8,
    max_length: int = 512,
    task: str = "generation",
    shuffle: bool = True
) -> DataLoader:
    """
    Create a PyTorch DataLoader with tokenization.
    
    Args:
        dataset: Hugging Face Dataset with 'function' and 'sequence' columns
        tokenizer: Pre-trained tokenizer (e.g., ESM tokenizer)
        batch_size: Batch size for training
        max_length: Maximum sequence length for tokenization
        task: Task type - 'generation' (function -> sequence) or 'classification' (sequence -> function)
        shuffle: Whether to shuffle the data
    
    Returns:
        PyTorch DataLoader ready for training
    """
    
    def tokenize_function(examples: Dict) -> Dict:
        """Tokenize sequences and function descriptions."""
        if task == "generation":
            # For generation: function -> sequence
            # Tokenize function descriptions as input
            model_inputs = tokenizer(
                examples["function"],
                max_length=max_length,
                truncation=True,
                padding="max_length"
            )
            
            # Tokenize sequences as labels
            labels = tokenizer(
                examples["sequence"],
                max_length=max_length,
                truncation=True,
                padding="max_length"
            )
            
            model_inputs["labels"] = labels["input_ids"]
            
        elif task == "classification":
            # For classification: sequence -> function
            # Tokenize sequences as input
            model_inputs = tokenizer(
                examples["sequence"],
                max_length=max_length,
                truncation=True,
                padding="max_length"
            )
            
            # Tokenize function descriptions as labels
            labels = tokenizer(
                examples["function"],
                max_length=max_length,
                truncation=True,
                padding="max_length"
            )
            
            model_inputs["labels"] = labels["input_ids"]
            
        else:
            raise ValueError(f"Unknown task: {task}. Use 'generation' or 'classification'")
        
        return model_inputs
    
    # Apply tokenization
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names
    )
    
    # Set format for PyTorch
    tokenized_dataset.set_format(type="torch")
    
    # Create DataLoader
    dataloader = DataLoader(
        tokenized_dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=0  # Set to 0 for Windows compatibility
    )
    
    return dataloader


def create_sequence_dataloader(
    dataset: Dataset,
    tokenizer: AutoTokenizer,
    batch_size: int = 8,
    max_length: int = 512,
    shuffle: bool = True
) -> DataLoader:
    """
    Create a DataLoader for sequence-only tasks (e.g., sequence generation, optimization).
    
    Args:
        dataset: Hugging Face Dataset with 'sequence' column
        tokenizer: Pre-trained tokenizer
        batch_size: Batch size for training
        max_length: Maximum sequence length
        shuffle: Whether to shuffle the data
    
    Returns:
        PyTorch DataLoader with tokenized sequences
    """
    
    def tokenize_sequences(examples: Dict) -> Dict:
        """Tokenize protein sequences only."""
        model_inputs = tokenizer(
            examples["sequence"],
            max_length=max_length,
            truncation=True,
            padding="max_length"
        )
        # For autoregressive models, labels are the same as input_ids (shifted during training)
        model_inputs["labels"] = model_inputs["input_ids"].copy()
        return model_inputs
    
    tokenized_dataset = dataset.map(
        tokenize_sequences,
        batched=True,
        remove_columns=[col for col in dataset.column_names if col != "sequence"]
    )
    
    tokenized_dataset.set_format(type="torch")
    
    dataloader = DataLoader(
        tokenized_dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=0
    )
    
    return dataloader


def test_dataloader(
    size: int = 50,
    batch_size: int = 4,
    max_length: int = 256,
    test_all_tasks: bool = True
):
    """
    Comprehensive test function for the dataloader module.
    
    Args:
        size: Number of proteins to fetch from UniProt (smaller for faster testing)
        batch_size: Batch size for DataLoader
        max_length: Maximum sequence length for tokenization
        test_all_tasks: If True, test both generation and classification tasks
    """
    print("=" * 60)
    print("DATALOADER TEST SUITE")
    print("=" * 60)
    
    # Test 1: Fetch UniProt data
    print("\n[TEST 1] Testing fetch_uniprot()...")
    try:
        df = fetch_uniprot(size=size)
        print(f"[OK] Successfully fetched {len(df)} proteins")
        print(f"  Columns: {list(df.columns)}")
        if len(df) > 0:
            print(f"  Sample function: {df['function'].iloc[0][:100]}...")
            print(f"  Sample sequence length: {len(df['sequence'].iloc[0])}")
    except Exception as e:
        print(f"X Error in fetch_uniprot(): {e}")
        return False
    
    # Test 2: Create Hugging Face Dataset
    print("\n[TEST 2] Testing create_protein_dataset()...")
    try:
        dataset = create_protein_dataset(size=size)
        print(f"[OK] Successfully created dataset with {len(dataset)} samples")
        print(f"  Dataset features: {dataset.features}")
        print(f"  Sample data: {dataset[0]}")
    except Exception as e:
        print(f"[ERROR] Error in create_protein_dataset(): {e}")
        return False
    
    # Test 3: Initialize tokenizer
    print("\n[TEST 3] Initializing tokenizer...")
    model_name = "facebook/esm2_t6_8M_UR50D"  # Lightweight ESM model
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print(f"[OK] Successfully loaded tokenizer: {model_name}")
        print(f"  Vocab size: {len(tokenizer)}")
    except Exception as e:
        logger.warning(f"Could not load {model_name}, using fallback tokenizer")
        try:
            from transformers import BertTokenizer
            tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
            print(f"[OK] Using fallback tokenizer: bert-base-uncased")
        except Exception as e2:
            print(f"[ERROR] Error loading tokenizer: {e2}")
            return False
    
    # Test 4: Create DataLoader for generation task
    print("\n[TEST 4] Testing create_dataloader() - GENERATION task...")
    try:
        dataloader_gen = create_dataloader(
            dataset,
            tokenizer,
            batch_size=batch_size,
            max_length=max_length,
            task="generation"
        )
        print(f"[OK] Successfully created generation DataLoader")
        print(f"  Number of batches: {len(dataloader_gen)}")
        
        # Test a few batches
        for batch_idx, batch in enumerate(dataloader_gen):
            print(f"\n  Batch {batch_idx + 1}:")
            print(f"    Keys: {list(batch.keys())}")
            print(f"    Input IDs shape: {batch['input_ids'].shape}")
            print(f"    Attention mask shape: {batch['attention_mask'].shape}")
            print(f"    Labels shape: {batch['labels'].shape}")
            print(f"    Input IDs dtype: {batch['input_ids'].dtype}")
            if batch_idx >= 1:  # Test first 2 batches
                break
    except Exception as e:
        print(f"[ERROR] Error in create_dataloader() - generation: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 5: Create DataLoader for classification task (if requested)
    if test_all_tasks:
        print("\n[TEST 5] Testing create_dataloader() - CLASSIFICATION task...")
        try:
            dataloader_cls = create_dataloader(
                dataset,
                tokenizer,
                batch_size=batch_size,
                max_length=max_length,
                task="classification"
            )
            print(f"[OK] Successfully created classification DataLoader")
            print(f"  Number of batches: {len(dataloader_cls)}")
            
            # Test one batch
            batch = next(iter(dataloader_cls))
            print(f"    Input IDs shape: {batch['input_ids'].shape}")
            print(f"    Labels shape: {batch['labels'].shape}")
        except Exception as e:
            print(f"[ERROR] Error in create_dataloader() - classification: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    # Test 6: Create sequence-only DataLoader
    print("\n[TEST 6] Testing create_sequence_dataloader()...")
    try:
        dataloader_seq = create_sequence_dataloader(
            dataset,
            tokenizer,
            batch_size=batch_size,
            max_length=max_length
        )
        print(f"[OK] Successfully created sequence DataLoader")
        print(f"  Number of batches: {len(dataloader_seq)}")
        
        # Test one batch
        batch = next(iter(dataloader_seq))
        print(f"    Input IDs shape: {batch['input_ids'].shape}")
        print(f"    Labels shape: {batch['labels'].shape}")
    except Exception as e:
        print(f"[ERROR] Error in create_sequence_dataloader(): {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # All tests passed
    print("\n" + "=" * 60)
    print("[SUCCESS] ALL TESTS PASSED!")
    print("=" * 60)
    return True


# Usage example and testing
if __name__ == "__main__":
    import argparse
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Test the dataloader module")
    parser.add_argument(
        "--size",
        type=int,
        default=50,
        help="Number of proteins to fetch (default: 50)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Batch size for DataLoader (default: 4)"
    )
    parser.add_argument(
        "--max-length",
        type=int,
        default=256,
        help="Maximum sequence length (default: 256)"
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick test (skip classification task)"
    )
    
    args = parser.parse_args()
    
    # Run tests
    success = test_dataloader(
        size=args.size,
        batch_size=args.batch_size,
        max_length=args.max_length,
        test_all_tasks=not args.quick
    )
    
    if not success:
        exit(1)
