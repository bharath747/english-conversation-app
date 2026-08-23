module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  try {
    const { message = '', history = [] } = req.body || {};
    if (!String(message).trim()) return res.status(400).json({ error: 'Message is required' });
    const context = Array.isArray(history) ? history.slice(-6).join('\n') : '';
    const prompt = `You are Sunny, a warm English buddy for a 5-year-old Telugu-speaking child. Reply in 1-2 very short sentences (max 25 words). Praise, gently correct only when needed, and ask one simple question. English first; add Telugu only when truly helpful.\n\nRecent:\n${context}\n\nChild: ${message}`;
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 80, temperature: 0.6 } })
    });
    const data = await response.json();
    if (!response.ok) {
      const messageText = data?.error?.message || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: messageText, retryAfterSeconds: retry ? Math.ceil(Number(retry[1])) : null });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Wonderful! Tell me one more thing.', provider: 'gemini', model });
  } catch (error) {
    console.error('Gemini chat exception:', error);
    return res.status(502).json({ error: 'Gemini conversation service is unavailable' });
  }
};