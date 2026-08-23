module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Gemini TTS is not configured.' });
  const { text = '', language = 'en' } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: 'Text is required' });

  const lang = language === 'te' ? 'Telugu' : 'English';
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  const voice = process.env.GEMINI_TTS_VOICE || 'Kore';
  const prompt = `Read only the following ${lang} text. Speak naturally, warmly, clearly and a little slowly for a five-year-old child. Do not say anything else.\n\n${text}`;

  function findAudio(data) {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) if (part?.inlineData?.data) return part.inlineData;
    return null;
  }
  function pcmToWav(base64, sampleRate = 24000) {
    const pcm = Buffer.from(base64, 'base64');
    const header = Buffer.alloc(44);
    header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
    header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]).toString('base64');
  }

  let lastError = 'No audio returned';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
          }
        })
      });
      const data = await response.json();
      const inline = findAudio(data);
      if (response.ok && inline?.data) {
        const mime = inline.mimeType || 'audio/L16;rate=24000';
        const rateMatch = /rate=(\d+)/i.exec(mime);
        const rate = rateMatch ? Number(rateMatch[1]) : 24000;
        return res.status(200).json({ audio: pcmToWav(inline.data, rate), mimeType: 'audio/wav', source: 'gemini', attempt });
      }
      lastError = data?.error?.message || data?.candidates?.[0]?.finishReason || 'No audio returned';
      console.error(`Gemini TTS attempt ${attempt}:`, JSON.stringify(data).slice(0, 1500));
    } catch (error) {
      lastError = error?.message || 'Could not reach Gemini TTS';
      console.error(`Gemini TTS attempt ${attempt} failed:`, lastError);
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 500));
  }
  return res.status(502).json({ error: `Gemini TTS failed after 3 attempts: ${lastError}` });
};