module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  try {
    const { message = '', history = [] } = req.body || {};
    const childMessage = String(message).trim();
    if (!childMessage) return res.status(400).json({ error: 'Message is required' });
    const context = Array.isArray(history) ? history.slice(-8).join('\n') : '';
    const prompt = `You are Sunny, an interactive English conversation friend for a 5-year-old Telugu-speaking child.

The child just said: "${childMessage}"

You MUST respond specifically to what the child said. Do not use generic repeated replies. NEVER say "Good job! Please say it one more time." or anything similar unless the child actually needs pronunciation practice.

Rules:
- Reply in simple English suitable for a 5-year-old.
- Usually 1-2 short sentences, maximum 30 words.
- Continue a natural conversation by reacting to the child's exact words and asking one related simple question.
- If the child's English is understandable but imperfect, gently model the correct sentence naturally.
- Be warm and playful.
- Do not mention that you are an AI.
- Telugu meaning may be added only if it genuinely helps understanding.

Examples:
Child: "My name is Nihansh" -> "Hi, Nihansh! I am happy to meet you. What is your favorite color?"
Child: "I like apples" -> "Yummy! Apples are sweet and healthy. What other fruit do you like?"
Child: "I am happy" -> "That is wonderful! I am happy too. What made you happy today?"

Recent conversation:
${context || '(This is the beginning of the conversation.)'}

Now answer naturally to the child.`;
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash-lite';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 100, temperature: 0.9, topP: 0.95 } })
    });
    const data = await response.json();
    if (!response.ok) {
      const messageText = data?.error?.message || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      console.error('Gemini chat error', { status: response.status, model, message: messageText });
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: messageText, retryAfterSeconds: retry ? Math.ceil(Number(retry[1])) : null });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!reply) return res.status(502).json({ error: 'Gemini returned an empty conversation response', provider: 'gemini', model });
    return res.status(200).json({ reply, provider: 'gemini', model });
  } catch (error) {
    console.error('Gemini chat exception:', error);
    return res.status(502).json({ error: 'Gemini conversation service is unavailable' });
  }
};