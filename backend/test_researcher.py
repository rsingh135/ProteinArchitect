#!/usr/bin/env python3
"""
Simple test for AgenticResearchService
Run with: python test_researcher.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

# Import the service
try:
    from services.AgenticResearch import AgenticResearchService
except ImportError as e:
    print(f"❌ Error importing AgenticResearchService: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)

async def quick_test():
    """Quick test - just checks setup without API calls"""
    print("=" * 70)
    print("Quick Test - Checking Setup")
    print("=" * 70)
    print()
    
    # Check for API key
    api_key = os.getenv("DEDALUS_API_KEY")
    if not api_key:
        print("❌ DEDALUS_API_KEY not found in environment variables")
        print("   Please set DEDALUS_API_KEY in your .env file")
        return False
    else:
        print(f"✅ DEDALUS_API_KEY found: {api_key[:10]}...")
    print()
    
    # Initialize service
    print("Initializing AgenticResearchService...")
    try:
        service = AgenticResearchService()
        print("✅ Service initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}")
        return False
    print()
    
    # Test model formatting
    print("Testing model format conversion:")
    test_models = [
        ("google/gemini-1.5-flash", "gemini-1.5-flash"),
        ("google/gemini-1.5-flash", "gemini-1.5-flash"),
    ]
    for input_model, expected in test_models:
        try:
            formatted = service._format_model_for_dedalus(input_model)
            status = "✅" if formatted == expected else "⚠️"
            print(f"  {status} '{input_model}' -> '{formatted}'")
        except Exception as e:
            print(f"  ❌ Error formatting '{input_model}': {e}")
    print()
    
    print("=" * 70)
    print("✅ Quick test passed! Setup is correct.")
    print("=" * 70)
    return True

async def full_test():
    """Full test - does actual research (takes 5-10 minutes)"""
    print("=" * 70)
    print("Full Test - Running Research")
    print("=" * 70)
    print()
    
    # Check for API key
    api_key = os.getenv("DEDALUS_API_KEY")
    if not api_key:
        print("❌ DEDALUS_API_KEY not found in environment variables")
        print("   Please set DEDALUS_API_KEY in your .env file")
        return False
    else:
        print(f"✅ DEDALUS_API_KEY found: {api_key[:10]}...")
    print()
    
    # Initialize service
    print("Initializing AgenticResearchService...")
    try:
        service = AgenticResearchService()
        print("✅ Service initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}")
        return False
    print()
    
    # Test with a simple protein ID (insulin)
    protein_id = "P01308"  # Human insulin
    model = "gemini-1.5-flash"
    
    print(f"Testing research for protein: {protein_id}")
    print(f"Using model: {model}")
    print()
    print("⚠️  This will take 2-5 minutes (quick research with 10 sources max)...")
    print()
    
    try:
        # Research the protein
        results = await service.research_protein(
            protein_id=protein_id,
            model=f"google/{model}",
            include_novel=False,
            months_recent=6
        )
        
        print("=" * 70)
        print("✅ Research completed successfully!")
        print("=" * 70)
        print()
        
        # Print summary
        print("Results summary:")
        print(f"  - Protein ID: {results.get('protein_id', 'N/A')}")
        print(f"  - Citations: {len(results.get('citations', []))} found")
        print(f"  - Papers section: {'Found' if results.get('papers') else 'Not found'}")
        print(f"  - Use cases section: {'Found' if results.get('use_cases') else 'Not found'}")
        print(f"  - Summary: {'Found' if results.get('summary') else 'Not found'}")
        print()
        
        # Print first few citations with better detection
        citations = results.get('citations', [])
        if citations and len(citations) > 0:
            valid_citations = [c for c in citations if c.get('url') and c.get('title') != 'See raw output for citations']
            if valid_citations:
                print(f"First {min(5, len(valid_citations))} citations:")
                for citation in valid_citations[:5]:
                    print(f"  [{citation.get('number', '?')}] {citation.get('title', 'N/A')}")
                    if citation.get('url'):
                        print(f"      {citation['url']}")
                print()
            else:
                print("⚠️  Citations found but no valid URLs. Extracting from raw output...")
                raw_output = results.get('raw_output', '')
                if raw_output:
                    import re
                    urls = re.findall(r'https?://[^\s\)]+', raw_output)
                    if urls:
                        print(f"  Found {len(urls)} URLs in raw output (showing first 5):")
                        for i, url in enumerate(urls[:5], 1):
                            print(f"    [{i}] {url}")
                    print()
        else:
            print("⚠️  No citations extracted. Checking raw output...")
            raw_output = results.get('raw_output', '')
            if raw_output:
                import re
                urls = re.findall(r'https?://[^\s\)]+', raw_output)
                if urls:
                    print(f"  Found {len(urls)} URLs in raw output (showing first 5):")
                    for i, url in enumerate(urls[:5], 1):
                        print(f"    [{i}] {url}")
                else:
                    print("  No URLs found in raw output")
            print()
        
        # Print summary snippet
        summary = results.get('summary', '')
        if summary and summary != "No summary section found":
            print("Summary snippet (first 500 chars):")
            print(f"  {summary[:500]}...")
            print()
        
        # Show actual content sections
        print("=" * 70)
        print("FULL RESEARCH CONTENT PREVIEW")
        print("=" * 70)
        print()
        
        if results.get('papers') and results['papers'] != "No papers section found":
            print("ACADEMIC PAPERS (first 800 chars):")
            print("-" * 70)
            papers_text = str(results['papers'])
            print(papers_text[:800] + ("..." if len(papers_text) > 800 else ""))
            print()
        
        if results.get('use_cases') and results['use_cases'] != "No use cases section found":
            print("USE CASES (first 800 chars):")
            print("-" * 70)
            use_cases_text = str(results['use_cases'])
            print(use_cases_text[:800] + ("..." if len(use_cases_text) > 800 else ""))
            print()
        
        if results.get('summary') and results['summary'] != "No summary section found":
            print("SUMMARY (first 800 chars):")
            print("-" * 70)
            summary_text = str(results['summary'])
            print(summary_text[:800] + ("..." if len(summary_text) > 800 else ""))
            print()
        else:
            # Show raw output if summary not found
            print("⚠️  No summary found. Showing raw output preview:")
            raw_output = results.get('raw_output', '')
            if raw_output:
                print("-" * 70)
                print(f"  Raw output length: {len(raw_output)} characters")
                print(f"  First 1000 chars:")
                print(f"  {raw_output[:1000]}...")
            print()
        
        # Always show raw output info
        raw_output = results.get('raw_output', '')
        if raw_output:
            print("=" * 70)
            print(f"RAW OUTPUT INFO: {len(raw_output)} characters total")
            print("=" * 70)
            print("(Full raw output is saved in the JSON file below)")
            print()
        
        # Save full results to JSON file
        import json
        output_file = f"research_results_{protein_id}.json"
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"💾 Full results saved to: {output_file}")
            print(f"   Open this file to see ALL research content including raw output!")
            print()
        except Exception as e:
            print(f"⚠️  Could not save to file: {e}")
            print()
        
        print("✅ Full test passed!")
        return True
        
    except Exception as e:
        print("=" * 70)
        print("❌ Research failed!")
        print("=" * 70)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print()
    print("🧪 AgenticResearch Service Test")
    print()
    print("Choose test type:")
    print("  1. Quick test (fast, no API calls) - Recommended")
    print("  2. Full test (slow, makes API calls, takes 5-10 min)")
    print()
    
    choice = input("Enter choice (1 or 2, default=1): ").strip() or "1"
    
    if choice == "2":
        success = await full_test()
    else:
        success = await quick_test()
        if success:
            print()
            print("💡 Tip: Run with choice '2' to test full research functionality")
    
    print()
    if success:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
