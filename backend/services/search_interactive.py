"""
Interactive script to search UniProt with user input
"""
import sys
from pathlib import Path
from dotenv import load_dotenv
import os

# Add GenLab directory to path so we can import from backend.services
current_dir = Path(__file__).parent.parent.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

try:
    from backend.services.query_generator import search_and_get_sequence
except ImportError:
    # Try relative import if running from within backend/services
    from query_generator import search_and_get_sequence

load_dotenv()

def main():
    print("=" * 70)
    print("UniProt Protein Sequence Search")
    print("=" * 70)
    print("\nEnter your protein search query in natural language.")
    print("Examples:")
    print("  - Find human enzymes")
    print("  - Find antimicrobial proteins")
    print("  - Find heat-resistant proteins")
    print("  - Find disease-associated human proteins")
    print()
    
    # Get user input
    user_query = input("Enter your search query: ").strip()
    
    if not user_query:
        print("\n[ERROR] No query provided. Exiting.")
        return
    
    # Check available APIs
    has_gemini = bool(os.getenv("GEMINI_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    # Ask which LLM to use (default to Gemini if available)
    print("\nChoose LLM for query generation:")
    if has_gemini:
        print("  1. Google Gemini - Available [RECOMMENDED - Best for medical/biological queries]")
        default_choice = "1"
    else:
        print("  1. Google Gemini - Not available (set GEMINI_API_KEY)")
        default_choice = "2"
    
    if has_openai:
        print("  2. OpenAI - Available")
    else:
        print("  2. OpenAI - Not available (set OPENAI_API_KEY)")
    
    print("  3. Local model (BioGPT) - Always available (lower quality)")
    
    llm_choice = input(f"\nEnter choice (1/2/3, default={default_choice}): ").strip() or default_choice
    
    use_gemini = False
    use_openai = False
    
    if llm_choice == "1" and has_gemini:
        use_gemini = True
        print("\nUsing Google Gemini for optimal medical/biological query generation...")
    elif llm_choice == "2" and has_openai:
        use_openai = True
        print("\nUsing OpenAI...")
    elif llm_choice == "1" and not has_gemini:
        print("\n[WARNING] Google Gemini not available. Falling back to local model...")
        print("Set GEMINI_API_KEY in .env file to use Gemini")
    else:
        print("\nUsing local model (BioGPT)...")
    
    # Get number of results
    max_results_input = input("\nNumber of results to show (default=10): ").strip()
    try:
        max_results = int(max_results_input) if max_results_input else 10
    except ValueError:
        max_results = 10
        print("Invalid input, using default: 10")
    
    print("\n" + "=" * 70)
    print("Searching...")
    print("=" * 70 + "\n")
    
    # Get number of top sequences to return
    top_n_input = input(f"\nNumber of top sequences to return (default=5): ").strip()
    try:
        top_n = int(top_n_input) if top_n_input else 5
    except ValueError:
        top_n = 5
        print("Invalid input, using default: 5")
    
    # Search and get sequences
    sequences = search_and_get_sequence(
        natural_language_query=user_query,
        max_results=max_results,
        top_n=top_n,
        use_gemini=use_gemini,
        use_openai=use_openai,
        reviewed_only=True
    )
    
    # Display result
    print("\n" + "=" * 70)
    if sequences:
        print(f"SUCCESS: Retrieved {len(sequences)} sequence(s)!")
        print("=" * 70)
        for i, result in enumerate(sequences, 1):
            print(f"\n[{i}] Protein ID: {result['protein_id']}")
            print(f"    UniProt URL: {result['url']}")
            print(f"    Function: {result['function'][:100]}{'...' if len(result['function']) > 100 else ''}")
            print(f"    Length: {result['length']} amino acids")
            print(f"    Sequence: {result['sequence']}")
        print("\n" + "=" * 70)
        print("You can now use these sequences for further analysis.")
        print("Click the UniProt URLs above to view detailed protein information.")
    else:
        print("No sequences found.")
        print("=" * 70)
    
    return sequences


if __name__ == "__main__":
    try:
        sequence = main()
    except KeyboardInterrupt:
        print("\n\nExiting...")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

