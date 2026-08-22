module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  try {
    const { message = '', history = [] } = req.body || {};
    if (!String(message).trim()) return res.status(400).json({ error: 'Message is required' });
    const context = Array.isArray(history) ? history.slice(-8).join('\n') : '';
    const prompt = `You are Sunny, a warm English conversation buddy for a 5-year-old child whose first language is Telugu. Build confidence and fluency through very short spoken English conversations. Use simple words and sentences suitable for age 5. If the child's English has an error, gently correct it by praising the attempt and giving one natural sentence to repeat. When helpful, add ONE short Telugu explanation in parentheses, but keep English dominant. Ask only one simple follow-up question. Never discuss adult, sexual, violent, dangerous, political, frightening, or private topics. Do not mention being an AI. Keep replies under 35 words.\n\nRecent conversation:\n${context}\n\nChild said:\n${message}`;
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (!response.ok) { console.error('Gemini chat error:', response.status, data); return res.status(response.status >= 500 ? 502 : response.status).json({ error: data.error && data.error.message ? data.error.message : 'Gemini request failed' }); }
    const reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: reply || 'Wonderful! Tell me one more thing.' });
  } catch (error) {
    console.error('Gemini chat exception:', error);
    return res.status(502).json({ error: 'Gemini conversation service is unavailable' });
  }
};