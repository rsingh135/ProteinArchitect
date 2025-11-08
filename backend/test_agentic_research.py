"""
Test script for AgenticResearch service
Run this to test the protein research functionality
"""

import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv
import os

# Add parent directory to path
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

load_dotenv()

# Check if API key is set
if not os.getenv("DEDALUS_API_KEY"):
    print("=" * 70)
    print("ERROR: DEDALUS_API_KEY not found in environment")
    print("=" * 70)
    print("\nPlease set your Dedalus Labs API key:")
    print("1. Get your API key from https://dedaluslabs.ai")
    print("2. Add it to your .env file: DEDALUS_API_KEY=your_key_here")
    print("3. Or export it: export DEDALUS_API_KEY=your_key_here")
    print("\n" + "=" * 70)
    sys.exit(1)

async def test_research():
    """Test the AgenticResearch service with a sample protein."""
    try:
        from services.AgenticResearch import AgenticResearchService
        
        print("=" * 70)
        print("Testing AgenticResearch Service")
        print("=" * 70)
        print("\nThis will research a protein using Dedalus Labs AI agents.")
        print("Note: This may take a few minutes as it searches multiple sources.\n")
        
        # Test with insulin (well-known protein)
        protein_id = "P01308"  # Human insulin
        
        print(f"Researching protein: {protein_id} (Human Insulin)")
        print("This is a good test case as it's well-studied with lots of research.\n")
        print("Starting research... (this may take 2-5 minutes)\n")
        print("-" * 70)
        
        # Initialize service
        service = AgenticResearchService()
        
        # Conduct research
        results = await service.research_protein(
            protein_id=protein_id,
            model="openai/gpt-4.1",
            include_novel=True,
            months_recent=6
        )
        
        # Display results
        print("\n" + "=" * 70)
        print("RESEARCH RESULTS")
        print("=" * 70)
        
        print("\n" + "-" * 70)
        print("CITATIONS")
        print("-" * 70)
        if results.get("citations"):
            for citation in results["citations"][:10]:  # Show first 10
                print(f"[{citation.get('number', '?')}] {citation.get('title', 'N/A')}")
                if citation.get('url'):
                    print(f"    {citation['url']}")
        else:
            print("No citations extracted (check raw_output for full citations)")
        
        print("\n" + "-" * 70)
        print("ACADEMIC PAPERS")
        print("-" * 70)
        papers_text = results.get("papers", "No papers section found")
        print(papers_text[:500] + "..." if len(papers_text) > 500 else papers_text)
        
        print("\n" + "-" * 70)
        print("USE CASES")
        print("-" * 70)
        use_cases_text = results.get("use_cases", "No use cases section found")
        print(use_cases_text[:500] + "..." if len(use_cases_text) > 500 else use_cases_text)
        
        print("\n" + "-" * 70)
        print("DRUG DEVELOPMENT")
        print("-" * 70)
        drug_dev_text = results.get("drug_development", "No drug development section found")
        print(drug_dev_text[:500] + "..." if len(drug_dev_text) > 500 else drug_dev_text)
        
        if results.get("novel_research"):
            print("\n" + "-" * 70)
            print("NOVEL RESEARCH (Last 6 months)")
            print("-" * 70)
            novel_text = results["novel_research"]
            print(novel_text[:500] + "..." if len(novel_text) > 500 else novel_text)
        
        print("\n" + "-" * 70)
        print("AI SUMMARY")
        print("-" * 70)
        summary_text = results.get("summary", "No summary section found")
        print(summary_text[:800] + "..." if len(summary_text) > 800 else summary_text)
        
        print("\n" + "=" * 70)
        print("TEST COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"\nFull results available in: results['raw_output']")
        print(f"Protein ID: {results.get('protein_id')}")
        print(f"Total citations found: {len(results.get('citations', []))}")
        
    except ImportError as e:
        print("=" * 70)
        print("IMPORT ERROR")
        print("=" * 70)
        print(f"\nError: {e}")
        print("\nMake sure dedalus-labs is installed:")
        print("  pip install dedalus-labs")
        sys.exit(1)
    
    except ValueError as e:
        print("=" * 70)
        print("CONFIGURATION ERROR")
        print("=" * 70)
        print(f"\nError: {e}")
        print("\nPlease check your .env file and ensure DEDALUS_API_KEY is set.")
        sys.exit(1)
    
    except Exception as e:
        print("=" * 70)
        print("ERROR DURING RESEARCH")
        print("=" * 70)
        print(f"\nError: {e}")
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()
        sys.exit(1)


async def test_custom_protein():
    """Test with a custom protein ID."""
    if len(sys.argv) > 1:
        protein_id = sys.argv[1]
    else:
        protein_id = input("\nEnter a UniProt protein ID to research (or press Enter for default P01308): ").strip()
        if not protein_id:
            protein_id = "P01308"
    
    try:
        from services.AgenticResearch import AgenticResearchService
        
        print(f"\nResearching protein: {protein_id}")
        print("Starting research...\n")
        
        service = AgenticResearchService()
        results = await service.research_protein(
            protein_id=protein_id,
            model="openai/gpt-4.1",
            include_novel=True,
            months_recent=6
        )
        
        print("\n" + "=" * 70)
        print("QUICK SUMMARY")
        print("=" * 70)
        print(f"Protein ID: {results.get('protein_id')}")
        print(f"Citations: {len(results.get('citations', []))}")
        print(f"\nSummary preview:")
        summary = results.get("summary", "No summary available")
        print(summary[:300] + "..." if len(summary) > 300 else summary)
        
        # Optionally save full results
        save = input("\nSave full results to file? (y/n): ").strip().lower()
        if save == 'y':
            import json
            filename = f"research_{protein_id}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"Results saved to: {filename}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("AgenticResearch Service Test")
    print("=" * 70)
    print("\nChoose test mode:")
    print("1. Default test (Human Insulin - P01308)")
    print("2. Custom protein ID")
    print("3. Exit")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == "1":
        asyncio.run(test_research())
    elif choice == "2":
        asyncio.run(test_custom_protein())
    else:
        print("Exiting...")
        sys.exit(0)

