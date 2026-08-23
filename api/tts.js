module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Gemini TTS is not configured.' });
  const { text = '', language = 'en' } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: 'Text is required' });

  const lang = language === 'te' ? 'Telugu' : 'English';
  const prompt = `Synthesize speech only. Do not speak these instructions. Speak the transcript exactly as written, naturally, warmly, clearly, and slowly for a 5-year-old child. Use natural ${lang} pronunciation. ${language === 'te' ? 'Use a natural Andhra Telugu accent.' : 'Use clear Indian English pronunciation.'}\n\nTranscript:\n${text}`;
  const body = {
    model: process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview',
    input: prompt,
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: process.env.GEMINI_TTS_VOICE || 'Kore' }] }
  };

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Api-Revision': '2026-05-20' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    const audio = data && data.output_audio && data.output_audio.data;
    if (!response.ok || !audio) throw new Error((data && data.error && data.error.message) || 'No audio returned');
    return res.status(200).json({ audio, mimeType: 'audio/pcm;rate=24000' });
  } catch (error) {
    console.error('Gemini TTS error:', error.message);
    return res.status(502).json({ error: 'Could not generate voice.' });
  }
};
