import 'dotenv/config';
import http from 'node:http';

const PORT = process.env.PORT || 5000;
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3.5';

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

const inferWithOllama = async (message, temperature = 0.2) => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: 'Tu es un assistant financier précis et utile.' },
        { role: 'user', content: message },
      ],
      stream: false,
      options: {
        temperature: parseFloat(temperature),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ollama error:', response.status, errorText);
    return '';
  }

  const data = await response.json();
  return data?.message?.content?.trim() || '';
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
      const temperature = parsed.temperature !== undefined ? parsed.temperature : 0.7;

      if (!message) {
        createErrorResponse(res, 400, 'Le message est vide.');
        return;
      }

      const reply = await inferWithOllama(message, temperature);

      if (!reply) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: `Réponse du backend : ${message}`, platform: 'ollama' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply, platform: 'ollama' }));
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
        ollama: {
          url: OLLAMA_BASE_URL,
          model: OLLAMA_MODEL,
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
