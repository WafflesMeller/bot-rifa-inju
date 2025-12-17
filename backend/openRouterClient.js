import fetch from 'node-fetch';

const OPENROUTER_URL = 'https://openrouter.ai/v1/chat/completions'; // revisar docs si cambia

export async function generateFromOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  // adaptar según la respuesta real de OpenRouter
  return json;
}
