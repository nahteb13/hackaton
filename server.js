import http from 'node:http';

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const server = http.createServer((req, res) => {
  const setCorsHeaders = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  };

  setCorsHeaders();

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const message = (parsed.message || '').toString().trim();

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Le message est vide.' }));
          return;
        }

        let reply;

        if (OPENAI_API_KEY) {
          const openaiResponse = await fetch(OPENAI_API_URL, {
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
              temperature: 0.7,
              max_tokens: 500,
            }),
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('OpenAI error:', openaiResponse.status, errorText);
          } else {
            const data = await openaiResponse.json();
            reply = data?.choices?.[0]?.message?.content?.trim();
          }
        }

        if (!reply) {
          reply = `Réponse du backend : ${message}`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (error) {
        console.error('Erreur backend:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erreur interne du serveur.' }));
      }
    });

    req.on('error', () => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erreur lors de la lecture de la requête' }));
    });

    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Backend API OK');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route non trouvée' }));
});

server.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY non configurée : fallback local activé.');
  }
});
