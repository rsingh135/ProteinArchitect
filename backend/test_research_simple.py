"""
Simple test client for AgenticResearch service
Just run: python test_research_simple.py
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

async def test():
    """Simple test function."""
    # Check API key
    if not os.getenv("DEDALUS_API_KEY"):
        print("❌ ERROR: DEDALUS_API_KEY not found in .env file")
        print("   Get your key from: https://dedaluslabs.ai")
        return
    
    # Import service
    try:
        from services.AgenticResearch import AgenticResearchService
    except ImportError as e:
        print(f"❌ ERROR: {e}")
        print("   Install with: pip install dedalus-labs")
        return
    
    # Get protein ID (default to insulin)
    protein_id = input("\nEnter protein ID (or press Enter for P01308 - Insulin): ").strip()
    if not protein_id:
        protein_id = "P01308"
    
    # Get model choice
    print("\nAvailable models:")
    print("  1. GPT-4.1 (default)")
    print("  2. Gemini 1.5 Pro")
    print("  3. Gemini 1.5 Flash (faster)")
    model_choice = input("Choose model (1/2/3, default=1): ").strip()
    
    model_map = {
        "1": "openai/gpt-4.1",
        "2": "gemini",  # Will resolve to google/gemini-1.5-pro
        "3": "gemini-1.5-flash"
    }
    model = model_map.get(model_choice, "openai/gpt-4.1")
    
    print(f"\n🔬 Researching protein: {protein_id}")
    print(f"🤖 Using model: {model}")
    print("⏳ This may take 2-5 minutes...\n")
    
    try:
        # Initialize and run
        service = AgenticResearchService()
        results = await service.research_protein(protein_id, model=model)
        
        # Display results
        print("\n" + "="*60)
        print("✅ RESEARCH COMPLETE!")
        print("="*60)
        
        print(f"\n📚 Citations: {len(results['citations'])} found")
        print(f"📄 Papers section: {'✓' if results['papers'] else '✗'}")
        print(f"💊 Use cases: {'✓' if results['use_cases'] else '✗'}")
        print(f"🧪 Drug development: {'✓' if results['drug_development'] else '✗'}")
        print(f"🆕 Novel research: {'✓' if results.get('novel_research') else '✗'}")
        print(f"📝 Summary: {'✓' if results['summary'] else '✗'}")
        
        # Show first few citations
        if results['citations']:
            print("\n📋 Sample Citations:")
            for i, cit in enumerate(results['citations'][:3], 1):
                print(f"   {i}. {cit.get('title', 'N/A')[:60]}...")
                if cit.get('url'):
                    print(f"      {cit['url'][:60]}...")
        
        # Show summary preview
        if results.get('summary'):
            print("\n📝 Summary Preview:")
            summary = results['summary'][:200]
            print(f"   {summary}...")
        
        print("\n" + "="*60)
        print("💡 Full results available in the 'results' dictionary")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*60)
    print("🧬 AgenticResearch Simple Test Client")
    print("="*60)
    asyncio.run(test())

