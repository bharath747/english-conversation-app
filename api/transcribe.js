const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Speech recognition is not configured. Add OPENAI_API_KEY in Vercel.' });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'Audio is required' });

    const buffer = Buffer.from(audio, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'Audio is empty' });
    if (buffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Audio is too large' });

    const extension = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' :
      mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await toFile(buffer, `child-speech.${extension}`, { type: mimeType });
    const result = await client.audio.transcriptions.create({
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
      file,
      language: 'en'
    });

    return res.status(200).json({ text: (result.text || '').trim() });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Could not understand the recording. Please try again.' });
  }
};
