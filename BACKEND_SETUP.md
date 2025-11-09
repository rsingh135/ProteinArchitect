# Backend Setup Guide

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `backend` directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   Or using Python:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

5. **Verify it's running:**
   Open http://localhost:8000 in your browser. You should see the API documentation.

## Testing the Chat Endpoint

You can test the chat endpoint using curl:

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the function of this protein?",
    "target_protein": {
      "uniprotId": "P01308",
      "name": "Insulin",
      "organism": "Homo sapiens",
      "function": "Regulates glucose metabolism"
    }
  }'
```

## Troubleshooting

- **"Chat service not available"**: Make sure `GEMINI_API_KEY` is set in your `.env` file
- **Port 8000 already in use**: Change the port in the uvicorn command: `--port 8001`
- **Import errors**: Make sure all dependencies are installed: `pip install -r requirements.txt`
