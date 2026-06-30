import 'dotenv/config';
import http from 'node:http';

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_PLATFORM = process.env.INFERENCE_PLATFORM || 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3.5';
const TRITON_BASE_URL = process.env.TRITON_URL || 'http://localhost:8000';
const TRITON_MODEL = process.env.TRITON_MODEL || 'phi3.5:3.8b';
const LMSTUDIO_BASE_URL = process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234';
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || 'phi-3.5-mini-instruct';
const CUSTOM_BASE_URL = process.env.CUSTOM_INFERENCE_URL || 'http://localhost:5001';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const createErrorResponse = (res, status, error) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error }));
};

const getRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    req.on('data', (chunk) => {
      buffer += chunk.toString();
    });
    req.on('end', () => resolve(buffer));
    req.on('error', reject);
  });

const normalizePlatform = (platform) => {
  const normalized = String(platform || DEFAULT_PLATFORM).toLowerCase();
  if (['backend', 'ollama', 'triton', 'lmstudio', 'custom', 'openai'].includes(normalized)) {
    return normalized;
  }
  return DEFAULT_PLATFORM;
};

const extractReply = (payload) => {
  if (typeof payload === 'string') return payload.trim();
  if (!payload) return '';
  return (
    payload.reply ||
    payload.message ||
    payload.answer ||
    payload.output ||
    payload.data ||
    payload.result ||
    ''
  ).toString().trim();
};

const inferWithOpenAI = async (message, temperature = 0.7) => {
  if (!OPENAI_API_KEY) {
    return '';
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant utile, clair et poli.' },
        { role: 'user', content: message },
      ],
      temperature: parseFloat(temperature),
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
};

const inferWithOllama = async (message, temperature = 0.2) => {
  // 1. On tape sur l'endpoint natif d'Ollama
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL, // Utilise 'phi3.5:3.8b'
      messages: [
        { role: 'system', content: 'Tu es un assistant financier précis et utile.' },
        { role: 'user', content: message },
      ],
      stream: false, // Bloque la réponse pour tout recevoir d'un coup
      options: {
        temperature: parseFloat(temperature), // Reste factuel par défaut
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ollama error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  // 2. On extrait le texte selon le format natif d'Ollama
  return data?.message?.content?.trim() || '';
};

const inferWithTriton = async (message) => {
  const response = await fetch(`${TRITON_BASE_URL}/v2/models/${TRITON_MODEL}/infer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: [
        {
          name: 'TEXT',
          shape: [1],
          datatype: 'BYTES',
          data: [message],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Triton error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  if (Array.isArray(data.outputs) && data.outputs.length > 0) {
    return data.outputs[0]?.data?.[0]?.toString().trim() || '';
  }

  return extractReply(data);
};

const inferWithLMStudio = async (message, temperature = 0.2) => {
  const response = await fetch(`${LMSTUDIO_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LMSTUDIO_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un assistant financier clair et utile.' },
        { role: 'user', content: message },
      ],
      temperature: parseFloat(temperature),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LM Studio error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || extractReply(data);
};

const inferWithCustom = async (message) => {
  if (!CUSTOM_BASE_URL) {
    throw new Error('CUSTOM_INFERENCE_URL n\'est pas configurée.');
  }

  const response = await fetch(CUSTOM_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Custom inference error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  return extractReply(data);
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const parsed = JSON.parse(body || '{}');
      const message = (parsed.message || '').toString().trim();
      const platform = normalizePlatform(parsed.platform);
      const temperature = parsed.temperature !== undefined ? parsed.temperature : 0.7;

      if (!message) {
        createErrorResponse(res, 400, 'Le message est vide.');
        return;
      }

      let reply = '';

      switch (platform) {
        case 'ollama':
          reply = await inferWithOllama(message, temperature);
          break;
        case 'triton':
          reply = await inferWithTriton(message);
          break;
        case 'lmstudio':
          reply = await inferWithLMStudio(message, temperature);
          break;
        case 'custom':
          reply = await inferWithCustom(message);
          break;
        case 'openai':
        case 'backend':
        default:
          reply = await inferWithOpenAI(message, temperature);
          break;
      }

      if (!reply) {
        reply = `Réponse du backend : ${message}`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply, platform }));
    } catch (error) {
      console.error('Erreur backend :', error);
      createErrorResponse(res, 500, 'Erreur interne du serveur.');
    }

    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        defaultPlatform: DEFAULT_PLATFORM,
        lmstudio: {
          url: LMSTUDIO_BASE_URL,
          model: LMSTUDIO_MODEL,
        },
        ollama: {
          url: OLLAMA_BASE_URL,
          model: OLLAMA_MODEL,
        },
        triton: {
          url: TRITON_BASE_URL,
          model: TRITON_MODEL,
        },
        custom: {
          url: CUSTOM_BASE_URL,
        },
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route non trouvée' }));
});

server.listen(PORT, () => {
  console.log(`Ollama tourne sur l'adresse: ${OLLAMA_BASE_URL}`);
});
