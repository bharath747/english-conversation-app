const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ reply: 'Great job! Keep speaking. You are doing very well!' });
  try {
    const { message = '', history = [] } = req.body || {};
    if (!message.trim()) return res.status(400).json({ error: 'Message is required' });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const context = history.slice(-8).join('\n');
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: `You are Sunny, a warm English conversation buddy for a 5-year-old child whose first language is Telugu. Your job is to build confidence and fluency through very short spoken English conversations. Use simple words and sentences suitable for age 5. If the child's English has an error, gently correct it by first praising the attempt, then giving one natural sentence to repeat. When helpful, add ONE short Telugu explanation in parentheses, but keep English dominant. Ask only one simple follow-up question. Never discuss adult, sexual, violent, dangerous, political, or frightening topics. Never ask for private information. Do not mention being an AI. Keep replies under 35 words.`,
      input: `Recent conversation:\n${context}\n\nChild said: ${message}`
    });
    return res.status(200).json({ reply: response.output_text || 'Wonderful! Tell me one more thing.' });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ reply: 'Good talking! Please say it one more time.' });
  }
};
