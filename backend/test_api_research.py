"""
Test script for AgenticResearch API endpoint
Tests the /research_protein endpoint via HTTP requests
"""

import requests
import json
import sys
from pathlib import Path

# Default API URL (adjust if your backend runs on different port)
API_URL = "http://localhost:8000"

def test_research_endpoint(protein_id: str = "P01308"):
    """Test the /research_protein API endpoint."""
    
    print("=" * 70)
    print("Testing /research_protein API Endpoint")
    print("=" * 70)
    
    # Check if server is running
    try:
        health_response = requests.get(f"{API_URL}/health", timeout=5)
        if health_response.status_code != 200:
            print(f"ERROR: Server health check failed. Status: {health_response.status_code}")
            return
        print("✓ Server is running")
    except requests.exceptions.ConnectionError:
        print(f"ERROR: Cannot connect to server at {API_URL}")
        print("\nMake sure the backend server is running:")
        print("  cd backend")
        print("  python main.py")
        print("\nOr if using uvicorn:")
        print("  uvicorn main:app --reload")
        return
    except Exception as e:
        print(f"ERROR: {e}")
        return
    
    # Prepare request
    endpoint = f"{API_URL}/research_protein"
    payload = {
        "protein_id": protein_id,
        "model": "openai/gpt-4.1",
        "include_novel": True,
        "months_recent": 6
    }
    
    print(f"\nResearching protein: {protein_id}")
    print(f"Endpoint: {endpoint}")
    print("This may take 2-5 minutes...\n")
    print("-" * 70)
    
    try:
        # Make request
        response = requests.post(
            endpoint,
            json=payload,
            timeout=600  # 10 minute timeout for research
        )
        
        # Check response
        if response.status_code == 200:
            results = response.json()
            
            print("\n" + "=" * 70)
            print("RESEARCH RESULTS")
            print("=" * 70)
            
            print(f"\nProtein ID: {results.get('protein_id')}")
            print(f"Citations found: {len(results.get('citations', []))}")
            
            # Show citations
            print("\n" + "-" * 70)
            print("CITATIONS (first 5)")
            print("-" * 70)
            for citation in results.get("citations", [])[:5]:
                print(f"[{citation.get('number', '?')}] {citation.get('title', 'N/A')}")
                if citation.get('url'):
                    print(f"    {citation['url']}")
            
            # Show summary
            print("\n" + "-" * 70)
            print("AI SUMMARY")
            print("-" * 70)
            summary = results.get("summary", "No summary available")
            print(summary[:500] + "..." if len(summary) > 500 else summary)
            
            # Option to save full results
            print("\n" + "=" * 70)
            save = input("Save full results to JSON file? (y/n): ").strip().lower()
            if save == 'y':
                filename = f"research_{protein_id}_api.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(results, f, indent=2, ensure_ascii=False)
                print(f"Results saved to: {filename}")
            
            print("\n" + "=" * 70)
            print("TEST COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            
        elif response.status_code == 503:
            print("ERROR: Service not available")
            print("Response:", response.json())
            print("\nMake sure DEDALUS_API_KEY is set in your .env file")
            
        elif response.status_code == 400:
            print("ERROR: Bad request")
            print("Response:", response.json())
            
        else:
            print(f"ERROR: Request failed with status {response.status_code}")
            print("Response:", response.text)
    
    except requests.exceptions.Timeout:
        print("ERROR: Request timed out (research took too long)")
        print("This might be normal for comprehensive research. Try again or check server logs.")
    
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Allow custom protein ID from command line
    protein_id = sys.argv[1] if len(sys.argv) > 1 else "P01308"
    
    print("\n" + "=" * 70)
    print("AgenticResearch API Test")
    print("=" * 70)
    print(f"\nAPI URL: {API_URL}")
    print(f"Default protein: {protein_id}")
    print("\nTo test a different protein:")
    print(f"  python test_api_research.py <PROTEIN_ID>")
    print(f"  Example: python test_api_research.py P04637")
    print()
    
    test_research_endpoint(protein_id)

