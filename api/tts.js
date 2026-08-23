module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Gemini TTS is not configured.' });
  const { text = '', language = 'en' } = req.body || {};
  if (!String(text).trim()) return res.status(400).json({ error: 'Text is required' });
  const lang = language === 'te' ? 'Telugu' : 'English';
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  const voice = process.env.GEMINI_TTS_VOICE || 'Kore';
  const prompt = `Read only this ${lang} text naturally, clearly and slowly for a five-year-old. Do not add anything: ${text}`;
  function findAudio(data) { for (const p of data?.candidates?.[0]?.content?.parts || []) if (p?.inlineData?.data) return p.inlineData; return null; }
  function pcmToWav(base64, rate) { const pcm=Buffer.from(base64,'base64'), h=Buffer.alloc(44); h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]).toString('base64'); }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY}, body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}}) });
    const data = await response.json();
    if (!response.ok) {
      const msg=data?.error?.message||'Gemini TTS failed'; const m=/retry in ([0-9.]+)s/i.exec(msg);
      return res.status(response.status>=500?502:response.status).json({error:msg,retryAfterSeconds:m?Math.ceil(Number(m[1])):null});
    }
    const inline=findAudio(data); if(!inline?.data) return res.status(502).json({error:'Gemini returned no audio'});
    const rm=/rate=(\d+)/i.exec(inline.mimeType||''); const rate=rm?Number(rm[1]):24000;
    return res.status(200).json({audio:pcmToWav(inline.data,rate),mimeType:'audio/wav',source:'gemini'});
  } catch(error) { console.error('Gemini TTS exception:',error); return res.status(502).json({error:'Gemini TTS is unavailable'}); }
};