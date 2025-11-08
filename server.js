import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: './frontend/.env.local' });

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Endpoint to generate ElevenLabs signed URL
app.get('/api/elevenlabs/signed-url', async (req, res) => {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const AGENT_ID = process.env.VITE_ELEVENLABS_AGENT_ID;

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    if (!AGENT_ID) {
      return res.status(500).json({ error: 'Agent ID not configured' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      return res.status(response.status).json({ error: 'Failed to get signed URL' });
    }

    const data = await response.json();
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
