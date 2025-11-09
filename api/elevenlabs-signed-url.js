// Vercel Serverless Function to generate ElevenLabs signed URLs
// This keeps the API key secure on the server side

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const AGENT_ID = process.env.VITE_ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID;

    if (!ELEVENLABS_API_KEY) {
      console.error('Missing ELEVENLABS_API_KEY');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    if (!AGENT_ID) {
      console.error('Missing ELEVENLABS_AGENT_ID');
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
      return res.status(response.status).json({ error: 'Failed to get signed URL from ElevenLabs' });
    }

    const data = await response.json();
    return res.status(200).json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
