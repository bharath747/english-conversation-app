module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Gemini TTS is not configured.' });
  const { text = '', language = 'en' } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: 'Text is required' });

  const lang = language === 'te' ? 'Telugu' : 'English';
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';
  const voice = process.env.GEMINI_TTS_VOICE || 'Kore';
  const prompt = `Synthesize speech only. Speak the following ${lang} text naturally, warmly, clearly, and slowly for a five-year-old child. Do not read any instructions aloud.\n\nTranscript:\n${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
        }
      })
    });
    const data = await response.json();
    const audio = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!response.ok || !audio) {
      console.error('Gemini TTS response:', JSON.stringify(data).slice(0, 1200));
      throw new Error(data?.error?.message || 'No audio returned');
    }
    return res.status(200).json({ audio, mimeType: 'audio/L16;rate=24000' });
  } catch (error) {
    console.error('Gemini TTS error:', error.message);
    return res.status(502).json({ error: error.message || 'Could not generate Gemini voice.' });
  }
};