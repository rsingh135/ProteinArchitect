"""
Test script for search_and_get_sequence function
"""
from dotenv import load_dotenv
from bioDesignModel.query_generator import search_and_get_sequence

load_dotenv()

if __name__ == "__main__":
    # Test the function
    print("Testing search_and_get_sequence function\n")
    
    # Example 1: Search for human enzymes
    sequence = search_and_get_sequence(
        "Find human enzymes",
        max_results=10,
        use_xai=True  # Use xAI if available, otherwise falls back to local
    )
    
    if sequence:
        print(f"\n{'='*70}")
        print("SUCCESS: Retrieved sequence")
        print(f"{'='*70}")
        print(f"Sequence length: {len(sequence)} amino acids")
        print(f"First 100 characters: {sequence[:100]}...")
    else:
        print("\nNo sequence found.")

