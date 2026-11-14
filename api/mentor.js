module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const accessCode = process.env.MENTOR_ACCESS_CODE;

  if (!apiKey || !accessCode) {
    return res.status(503).json({ error: 'Backend not configured' });
  }

  if (req.headers['x-mentor-code'] !== accessCode) {
    return res.status(401).json({ error: 'Wrong access code' });
  }

  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 5000) {
    return res.status(400).json({ error: 'Invalid question' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are LYTMUS AI, a NEET 2027 study mentor. Explain Biology, Physics and Chemistry accurately at NCERT and NEET level. Give clear explanations, practice questions and realistic study plans. Never invent facts.'
            }]
          },
          contents: [{
            parts: [{ text: message.trim() }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: 'Gemini API request failed' });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '').join('');

    if (!reply) {
      return res.status(502).json({ error: 'No AI response received' });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: 'Server connection failed' });
  }
};
