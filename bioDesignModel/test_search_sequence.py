"""
Test script for search_and_get_sequence function
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add GenLab directory to path
current_dir = Path(__file__).parent
genlab_dir = current_dir.parent
if str(genlab_dir) not in sys.path:
    sys.path.insert(0, str(genlab_dir))

from backend.services.query_generator import search_and_get_sequence

load_dotenv()

if __name__ == "__main__":
    # Test the function
    print("Testing search_and_get_sequence function\n")
    
    # Example 1: Search for human enzymes
    sequence = search_and_get_sequence(
        "Find human enzymes",
        max_results=10,
        use_gemini=True  # Use Gemini if available, otherwise falls back to local
    )
    
    if sequence:
        print(f"\n{'='*70}")
        print("SUCCESS: Retrieved sequence")
        print(f"{'='*70}")
        print(f"Sequence length: {len(sequence)} amino acids")
        print(f"First 100 characters: {sequence[:100]}...")
    else:
        print("\nNo sequence found.")


