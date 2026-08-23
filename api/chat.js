module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

  try {
    const { message = '', history = [] } = req.body || {};
    const childMessage = String(message).trim();
    if (!childMessage) return res.status(400).json({ error: 'Message is required' });

    const context = Array.isArray(history) ? history.slice(-6).join('\n') : '';
    const prompt = `You are Sunny, a friendly English conversation partner for a 5-year-old Telugu-speaking child.

The child said: "${childMessage}"

Respond specifically to these exact words. Never give a generic repeated reply such as "Good job! Please say it one more time." unless the child explicitly asks to practise pronunciation.

Rules:
- Use very simple, natural English.
- Reply in 1 or 2 short sentences, maximum 30 words.
- React to what the child actually said and ask one related easy question.
- If the English is slightly incorrect, gently show the natural version.
- Be warm, playful and encouraging.
- Do not say you are an AI.

Recent conversation:
${context || '(start of conversation)'}

Answer the child now.`;

    // gemini-3-flash is the model already confirmed by the user's quota response.
    // Allow an explicit environment override, but avoid the unavailable 2.5-flash-lite default.
    const model = process.env.GEMINI_CHAT_MODEL || 'gemini-3-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 100, temperature: 0.8 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const messageText = data?.error?.message || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      console.error('Gemini chat error', JSON.stringify({ status: response.status, model, message: messageText }));
      // Gemini's HTTP status is upstream information. Do not make the frontend think
      // the Vercel /api/chat route itself is missing.
      const clientStatus = response.status === 429 ? 429 : 502;
      return res.status(clientStatus).json({
        error: messageText,
        provider: 'gemini',
        model,
        upstreamStatus: response.status,
        retryAfterSeconds: retry ? Math.ceil(Number(retry[1])) : null
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!reply) {
      console.error('Gemini chat empty response', JSON.stringify({ model, data }));
      return res.status(502).json({ error: 'Gemini returned an empty conversation response', provider: 'gemini', model });
    }

    return res.status(200).json({ reply, provider: 'gemini', model });
  } catch (error) {
    console.error('Gemini chat exception:', error);
    return res.status(502).json({ error: 'Gemini conversation service is unavailable' });
  }
};