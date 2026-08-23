module.exports = async function handler(req, res) {
  const debugId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader('x-sunny-debug-id', debugId);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', debugId });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured', debugId });

  try {
    const { message = '', history = [] } = req.body || {};
    const childMessage = String(message).trim();
    if (!childMessage) return res.status(400).json({ error: 'Message is required', debugId });

    const context = Array.isArray(history) ? history.slice(-6).join('\n') : '';
    const prompt = `You are Sunny, a friendly English conversation partner for a 5-year-old Telugu-speaking child.\n\nThe child said: "${childMessage}"\n\nRespond specifically to the child's exact words. Never use a generic response such as "Good job! Please say it one more time." unless the child explicitly asks for pronunciation practice.\n\nRules:\n- Use very simple, natural English.\n- Reply in 1 or 2 short sentences, maximum 30 words.\n- React to what the child actually said and ask one related easy question.\n- If the English is slightly incorrect, gently show the natural version.\n- Be warm, playful and encouraging.\n- Do not say you are an AI.\n\nRecent conversation:\n${context || '(start of conversation)'}\n\nAnswer the child now.`;

    const primaryModel = process.env.GEMINI_CHAT_MODEL || 'gemini-3-flash-preview';
    const fallbackModel = 'gemini-2.5-flash';

    async function generate(model) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 100, temperature: 0.8 } })
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch (_) { data = { raw: raw.slice(0, 1000) }; }
      return { response, data, model, raw: raw.slice(0, 1000) };
    }

    console.log('Sunny chat start', JSON.stringify({ debugId, primaryModel, childMessage }));
    let result = await generate(primaryModel);
    console.log('Gemini upstream result', JSON.stringify({ debugId, model: result.model, status: result.response.status, body: result.data }));

    if (result.response.status === 404 && primaryModel !== fallbackModel) {
      console.warn('Gemini primary unavailable, trying fallback', JSON.stringify({ debugId, primaryModel, fallbackModel, error: result.data?.error?.message || result.raw }));
      result = await generate(fallbackModel);
      console.log('Gemini fallback result', JSON.stringify({ debugId, model: result.model, status: result.response.status, body: result.data }));
    }

    const { response, data, model } = result;
    if (!response.ok) {
      const messageText = data?.error?.message || data?.raw || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      console.error('Gemini chat failure', JSON.stringify({ debugId, status: response.status, model, message: messageText }));
      return res.status(response.status === 429 ? 429 : 502).json({ error: messageText, provider: 'gemini', model, upstreamStatus: response.status, retryAfterSeconds: retry ? Math.ceil(Number(retry[1])) : null, debugId });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!reply) {
      console.error('Gemini empty reply', JSON.stringify({ debugId, model, body: data }));
      return res.status(502).json({ error: 'Gemini returned an empty conversation response', provider: 'gemini', model, debugId });
    }

    console.log('Gemini chat success', JSON.stringify({ debugId, model, childMessage, reply }));
    return res.status(200).json({ reply, provider: 'gemini', model, debugId });
  } catch (error) {
    console.error('Gemini chat exception', JSON.stringify({ debugId, name: error?.name, message: error?.message, stack: error?.stack }));
    return res.status(502).json({ error: 'Gemini conversation service is unavailable', debugId });
  }
};