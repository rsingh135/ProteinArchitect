# Testing AgenticResearch Service

This guide explains how to test the AgenticResearch service.

## Prerequisites

1. **Dedalus Labs API Key**
   - Sign up at https://dedaluslabs.ai
   - Get your API key from the dashboard
   - Add it to your `.env` file:
     ```
     DEDALUS_API_KEY=your_api_key_here
     ```

2. **Install Dependencies**
   ```bash
   pip install dedalus-labs
   ```
   (Already in requirements.txt)

## Testing Methods

### Method 1: Direct Python Test (Recommended for First Test)

Test the service directly without the API:

```bash
cd backend
python test_agentic_research.py
```

**Options:**
- Option 1: Test with default protein (Human Insulin - P01308)
- Option 2: Test with custom protein ID
- Option 3: Exit

**Example:**
```bash
python test_agentic_research.py
# Choose option 1 for default test
# Or choose option 2 and enter a protein ID like "P04637" (p53)
```

### Method 2: API Endpoint Test

Test via the FastAPI endpoint:

1. **Start the backend server:**
   ```bash
   cd backend
   python main.py
   # Or with uvicorn:
   uvicorn main:app --reload
   ```

2. **In another terminal, run the API test:**
   ```bash
   cd backend
   python test_api_research.py
   ```

3. **Or test with a custom protein:**
   ```bash
   python test_api_research.py P04637
   ```

### Method 3: Manual API Test (curl/Postman)

**Using curl:**
```bash
curl -X POST "http://localhost:8000/research_protein" \
  -H "Content-Type: application/json" \
  -d '{
    "protein_id": "P01308",
    "model": "openai/gpt-4.1",
    "include_novel": true,
    "months_recent": 6
  }'
```

**Using Python requests:**
```python
import requests

response = requests.post(
    "http://localhost:8000/research_protein",
    json={
        "protein_id": "P01308",
        "model": "openai/gpt-4.1",
        "include_novel": True,
        "months_recent": 6
    }
)

results = response.json()
print(results)
```

## Test Protein IDs

Here are some well-studied proteins you can test with:

- **P01308** - Human Insulin (well-documented, good for first test)
- **P04637** - p53 tumor suppressor (extensive research)
- **P00520** - Abl tyrosine kinase (drug target)
- **P12931** - SRC proto-oncogene (well-researched)
- **P01112** - HRAS (cancer-related, lots of research)

## Expected Results

A successful test should return:

```json
{
  "protein_id": "P01308",
  "citations": [
    {"number": "1", "title": "...", "url": "..."},
    ...
  ],
  "papers": "Academic papers section...",
  "use_cases": "Use cases section...",
  "drug_development": "Drug development section...",
  "research_references": "Research references...",
  "novel_research": "Novel research (last 6 months)...",
  "summary": "AI-generated comprehensive summary...",
  "raw_output": "Full agent response..."
}
```

## Troubleshooting

### Error: DEDALUS_API_KEY not found
- Make sure you've added the API key to your `.env` file
- Check that the `.env` file is in the correct location (backend/ or project root)
- Restart your terminal/server after adding the key

### Error: Cannot connect to server
- Make sure the backend server is running
- Check that it's running on the correct port (default: 8000)
- Verify the API_URL in test_api_research.py matches your server

### Error: Service not available (503)
- Check that DEDALUS_API_KEY is set correctly
- Verify the API key is valid at https://dedaluslabs.ai
- Check server logs for detailed error messages

### Research takes a long time
- This is normal! Comprehensive research can take 2-5 minutes
- The agent searches multiple sources and synthesizes information
- Be patient, especially for the first test

### No citations found
- Check the `raw_output` field - citations may be in the full text
- The agent may format citations differently than expected
- Try a different, well-researched protein ID

## Performance Notes

- First request may be slower (cold start)
- Research typically takes 2-5 minutes
- Results are cached by the agent internally
- API timeout is set to 10 minutes for comprehensive research

## Next Steps

After successful testing:
1. Integrate into your frontend
2. Add error handling for your use case
3. Customize the research prompt if needed
4. Adjust model selection based on your needs

