// Vercel serverless function to interface with the OpenAI Chat API.
// It accepts a POST request containing a conversation history and a learning mode
// (beginner or advanced). It returns a reply from the assistant that introduces
// or deepens knowledge of Taoist philosophy accordingly.

// Export as CommonJS module for Vercel Node runtime
module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  // Gather request body
  let rawBody = '';
  await new Promise((resolve) => {
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', resolve);
  });

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
  const mode = typeof parsed.mode === 'string' ? parsed.mode : 'beginner';

  // System prompt definitions for each mode
  const prompts = {
    beginner:
      '你是一位耐心且博学的道家导师，负责帮助零基础用户理解中国道家文化。请用浅显易懂的语言解释道家思想、历史人物、经典著作，让读者能够逐步入门。避免使用复杂的专业术语，如必须使用，请附上简短解释。回答应当友好、鼓励性强，适合刚接触道学的人群。',
    advanced:
      '你是一位资深的道家学者，致力于为已有一定基础的用户提供深入的道家知识。请提供更高层次的分析，包括哲理阐述、典籍比较、历史背景、实践方法等，语言可以更学术，但仍要尽量清晰。鼓励用户思考和体悟道家智慧的深层含义。',
  };
  const systemPrompt = prompts[mode] || prompts.beginner;

  // Compose message list with system prompt
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 800,
        n: 1,
        stop: null,
      }),
    });
    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errorText);
      res.status(500).json({ error: 'Failed to fetch from OpenAI' });
      return;
    }
    const json = await openaiRes.json();
    const reply = json.choices?.[0]?.message?.content || '';
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Request to OpenAI failed:', error);
    res.status(500).json({ error: 'Request to OpenAI failed' });
  }
};
