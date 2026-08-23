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
    const prompt = `You are Sunny, a friendly English teacher and conversation partner for a 5-year-old Telugu-speaking child.

The child said: "${childMessage}"

Important Telugu handling:
- The child may speak Telugu, Telugu written in English letters (Roman Telugu), English, or a mixture.
- Understand phrases such as "Bag antaru" or "Bag అంటారు" as Telugu-assisted language learning, not as meaningless English.
- When Telugu or mixed Telugu-English is used, identify the likely meaning and gently teach the correct natural English sentence.
- Example: "Bag antaru" can be answered: "Yes! In English, we say: This is a bag. Can you say: This is a bag?"
- If you are unsure what a Telugu phrase means, ask one simple clarification question instead of inventing an answer.

Respond specifically to the child's exact words. Never use the generic response "Good job! Please say it one more time." unless the child explicitly asks for pronunciation practice.

Rules:
- Use very simple, natural English suitable for a 5-year-old.
- Reply in 1 or 2 short sentences and usually include one related easy question.
- Give a complete answer; never stop mid-sentence.
- If the English is slightly incorrect, gently show the natural version.
- Be warm, playful and encouraging.
- Do not say you are an AI.

Recent conversation:
${context || '(start of conversation)'}

Answer the child now.`;

    // The API explicitly reports that Gemini 2.5 Flash is unavailable for this new API key.
    // Gemini 3.6 Flash is the provider-recommended replacement.
    const primaryModel = process.env.GEMINI_CHAT_MODEL || 'gemini-3.6-flash';

    async function generate(model) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.5 }
        })
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch (_) { data = { raw: raw.slice(0, 1000) }; }
      return { response, data, model, raw: raw.slice(0, 1000) };
    }

    console.log('Sunny chat start', JSON.stringify({ debugId, primaryModel, childMessage }));
    const result = await generate(primaryModel);
    console.log('Gemini upstream result', JSON.stringify({ debugId, model: result.model, status: result.response.status, body: result.data }));

    const { response, data, model } = result;
    if (!response.ok) {
      const messageText = data?.error?.message || data?.raw || 'Gemini request failed';
      const retry = /retry in ([0-9.]+)s/i.exec(messageText);
      console.error('Gemini chat failure', JSON.stringify({ debugId, status: response.status, model, message: messageText }));
      return res.status(response.status === 429 ? 429 : 502).json({ error: messageText, provider: 'gemini', model, upstreamStatus: response.status, retryAfterSeconds: retry ? Math.ceil(Number(retry[1])) : null, debugId });
    }

    const candidate = data?.candidates?.[0];
    const reply = candidate?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!reply) {
      console.error('Gemini empty reply', JSON.stringify({ debugId, model, finishReason: candidate?.finishReason, body: data }));
      return res.status(502).json({ error: 'Gemini returned an empty conversation response', provider: 'gemini', model, finishReason: candidate?.finishReason || null, debugId });
    }

    console.log('Gemini chat success', JSON.stringify({ debugId, model, childMessage, reply, finishReason: candidate?.finishReason }));
    return res.status(200).json({ reply, provider: 'gemini', model, debugId });
  } catch (error) {
    console.error('Gemini chat exception', JSON.stringify({ debugId, name: error?.name, message: error?.message, stack: error?.stack }));
    return res.status(502).json({ error: 'Gemini conversation service is unavailable', debugId });
  }
};