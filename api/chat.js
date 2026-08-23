module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

  try {
    const { message = '', history = [] } = req.body || {};
    const childMessage = String(message).trim();
    if (!childMessage) return res.status(400).json({ error: 'Message is required' });

    const context = Array.isArray(history) ? history.slice(-6).join('\n') : '';
    const prompt = `You are Sunny, a friendly English conversation partner for a 5-year-old Telugu-speaking child.\n\nThe child said: "${childMessage}"\n\nRespond specifically to these exact words. Never give a generic repeated reply such as "Good job! Please say it one more time." unless the child explicitly asks to practise pronunciation.\n\nRules:\n- Use very simple, natural English.\n- Reply in 1 or 2 short sentences, maximum 30 words.\n- React to what the child actually said and ask one related easy question.\n- If the English is slightly incorrect, gently show the natural version.\n- Be warm, playful and encouraging.\n- Do not say you are an AI.\n\nRecent conversation:\n${context || '(start of conversation)'}\n\nAnswer the child now.`;

    // Use an exact documented model name. GEMINI_CHAT_MODEL can override this in Vercel.
    const primaryModel = process.env.GEMINI_CHAT_MODEL || 'gemini-3-flash-preview';
    const fallbackModel = 'gemini-2.5-flash';

    async function generate(model) {
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
      let data;
      try { data = await response.json(); }
      catch (_) { data = { error: { message: 'Gemini returned a non-JSON response' } }; }
      return { response, data, model };
    }

    let result = await generate(primaryModel);

    // A 404 usually means the configured model is not available to this API key/version.
    // Try a stable fallback automatically so the child does not lose the conversation.
    if (result.response.status === 404 && primaryModel !== fallbackModel) {
      console.error('Gemini primary model unavailable; trying fallback', JSON.stringify({ model: primaryModel, upstreamStatus: 404, message: result.data?.error?.message }));
      result = await generate(fallbackModel);
    }

    const { response, data, model } = result;
    if (!response.ok) {
      const messageText = data?.error?.message || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      console.error('Gemini chat error', JSON.stringify({ status: response.status, model, message: messageText }));
      return res.status(response.status === 429 ? 429 : 502).json({
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

    console.log('Gemini chat success', JSON.stringify({ model, childMessage, reply }));
    return res.status(200).json({ reply, provider: 'gemini', model });
  } catch (error) {
    console.error('Gemini chat exception:', error);
    return res.status(502).json({ error: 'Gemini conversation service is unavailable' });
  }
};