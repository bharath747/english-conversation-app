module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });
  try {
    const { audio, mimeType = 'audio/webm' } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'Audio is required' });
    const buffer = Buffer.from(audio, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'Audio is empty' });
    if (buffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Audio is too large' });
    const prompt = 'Transcribe the child speaking in this audio. Return ONLY the words spoken in English, with normal punctuation. If Telugu is spoken, transcribe the Telugu words as spoken. Do not explain, translate, or add anything. If the audio is unclear, return an empty string.';
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: audio } }] }] })
    });
    const data = await response.json();
    if (!response.ok) { console.error('Gemini transcription error:', response.status, data); return res.status(response.status >= 500 ? 502 : response.status).json({ error: data.error && data.error.message ? data.error.message : 'Gemini speech recognition failed' }); }
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    return res.status(200).json({ text: (text || '').trim() });
  } catch (error) {
    console.error('Gemini transcription exception:', error);
    return res.status(502).json({ error: 'Gemini speech recognition is unavailable' });
  }
};