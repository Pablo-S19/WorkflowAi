export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, systemInstruction } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };

  const r = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    }
  );

  res.status(r.status).json(await r.json());
}