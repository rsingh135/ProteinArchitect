"""
Internal test file for bioDesignModel dataloader
Run this with: python -m bioDesignModel.test_dataloader
Or from GenLab directory: python -m bioDesignModel.test_dataloader
"""

from .dataloader import (
    fetch_uniprot,
    create_protein_dataset,
    create_dataloader,
    create_sequence_dataloader,
    test_dataloader
)
from transformers import AutoTokenizer

def main():
    print("=" * 70)
    print("INTERNAL DATALOADER TESTING")
    print("=" * 70)
    
    # Option 1: Run the comprehensive test suite
    print("\n[OPTION 1] Running comprehensive test suite...")
    print("-" * 70)
    success = test_dataloader(
        size=20,          # Small number for quick testing
        batch_size=4,
        max_length=256,
        test_all_tasks=True
    )
    
    if not success:
        print("\n[ERROR] Test suite failed!")
        return
    
    print("\n" + "=" * 70)
    print("[OPTION 2] Testing individual functions...")
    print("=" * 70)
    
    # Option 2: Test individual functions
    try:
        # Test 1: Fetch data
        print("\n1. Testing fetch_uniprot()...")
        df = fetch_uniprot(size=10)
        print(f"   [OK] Fetched {len(df)} proteins")
        print(f"   Sample function: {df['function'].iloc[0][:80]}...")
        print(f"   Sample sequence (first 50 chars): {df['sequence'].iloc[0][:50]}...")
        
        # Test 2: Create dataset
        print("\n2. Testing create_protein_dataset()...")
        dataset = create_protein_dataset(size=10)
        print(f"   [OK] Created dataset with {len(dataset)} samples")
        print(f"   Features: {list(dataset.features.keys())}")
        
        # Test 3: Load tokenizer
        print("\n3. Loading tokenizer...")
        try:
            tokenizer = AutoTokenizer.from_pretrained("facebook/esm2_t6_8M_UR50D")
            print(f"   [OK] Loaded ESM tokenizer")
        except:
            from transformers import BertTokenizer
            tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
            print(f"   [OK] Loaded fallback BERT tokenizer")
        
        # Test 4: Create generation dataloader
        print("\n4. Testing create_dataloader() - GENERATION task...")
        dataloader_gen = create_dataloader(
            dataset,
            tokenizer,
            batch_size=2,
            max_length=128,
            task="generation"
        )
        print(f"   [OK] Created generation DataLoader with {len(dataloader_gen)} batches")
        
        # Get one batch
        batch = next(iter(dataloader_gen))
        print(f"   Batch shape - Input IDs: {batch['input_ids'].shape}, Labels: {batch['labels'].shape}")
        
        # Test 5: Create classification dataloader
        print("\n5. Testing create_dataloader() - CLASSIFICATION task...")
        dataloader_cls = create_dataloader(
            dataset,
            tokenizer,
            batch_size=2,
            max_length=128,
            task="classification"
        )
        print(f"   [OK] Created classification DataLoader with {len(dataloader_cls)} batches")
        
        batch = next(iter(dataloader_cls))
        print(f"   Batch shape - Input IDs: {batch['input_ids'].shape}, Labels: {batch['labels'].shape}")
        
        # Test 6: Create sequence-only dataloader
        print("\n6. Testing create_sequence_dataloader()...")
        dataloader_seq = create_sequence_dataloader(
            dataset,
            tokenizer,
            batch_size=2,
            max_length=128
        )
        print(f"   [OK] Created sequence DataLoader with {len(dataloader_seq)} batches")
        
        batch = next(iter(dataloader_seq))
        print(f"   Batch shape - Input IDs: {batch['input_ids'].shape}, Labels: {batch['labels'].shape}")
        
        print("\n" + "=" * 70)
        print("[SUCCESS] ALL INDIVIDUAL TESTS PASSED!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n[ERROR] Error during individual tests: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("\n" + "=" * 70)
    print("[SUCCESS] ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()

