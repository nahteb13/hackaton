# TechCorp AI Chat — Guide DEV WEB

## Objectif
L'objectif principal est d'offrir une interface web de chat fonctionnelle qui peut se connecter à plusieurs serveurs d'inférence :
- **LM Studio** (moteur local simple)
- **Ollama** (`http://localhost:11434`)
- **Triton** (`http://localhost:8000`)
- **Serveur maison** (URL fournie par l'équipe INFRA)

Le frontend React interroge un backend Node.js (`server.js`) qui relaye la requête vers le serveur d'inférence choisi.

## Structure du projet

```
techcorp-ai-chat/
├── server.js
├── src/
│   ├── App.jsx
│   ├── shared/
│   │   └── ChatbotBase.jsx
│   ├── ollama_server/
│   │   └── Chatbot.jsx
│   ├── tritton_server/
│   │   └── Chatbot.jsx
│   ├── lmstudio_server/
│   │   └── Chatbot.jsx
│   ├── custom_server/
│   │   └── Chatbot.jsx
│   └── ...
├── .env.example
└── README_PROJECT.md
```

## Utilisation

### 1. Préparer l'environnement

Copie le fichier d'exemple :

```bash
cp .env.example .env
```

Puis adapte les URLs si nécessaire :
- `VITE_API_URL` : backend Node.js
- `LMSTUDIO_URL` : LM Studio local
- `OLLAMA_URL` : Ollama local
- `TRITON_URL` : Triton local
- `CUSTOM_INFERENCE_URL` : serveur maison

### 2. Lancer le backend

```bash
npm run backend
```

### 3. Lancer le frontend

```bash
npm run dev
```

### 4. Tester dans l'interface

- Ouvre `http://localhost:5173` ou l'URL fournie par Vite
- Sélectionne le serveur d'inférence désiré
- Tape un message et envoie

---

## API backend

Le backend expose une route :

- `POST /api/chat`

Payload JSON :

```json
{
  "message": "Bonjour",
  "platform": "lmstudio"
}
```

Réponse attendue :

```json
{
  "reply": "...",
  "platform": "lmstudio"
}
```

---

## Comportement par plateforme

- **LM Studio** : utilise `LMSTUDIO_URL` / `LMSTUDIO_MODEL`
- **Ollama** : utilise `OLLAMA_URL` / `OLLAMA_MODEL`
- **Triton** : fait un POST sur `/v2/models/<model>/infer`
- **Serveur maison** : fait un POST sur `CUSTOM_INFERENCE_URL`

---

## Validation de bon fonctionnement

### LM Studio
- Assure-toi que LM Studio est lancé
- Vérifie `http://127.0.0.1:1234/v1/models` ou `/v1/chat/completions`

### Ollama
- Assure-toi qu'Ollama est lancé
- Vérifie `http://localhost:11434/v1/models`

### Triton
- Assure-toi que Triton est lancé
- Vérifie :
  - `http://localhost:8000/v2/health/ready`
  - `http://localhost:8000/v2/models`

### Serveur maison
- Assure-toi que le serveur fournie par INFRA répond à la route attendue

---

## Points à noter pour DEV WEB

- L'UI ne dépend pas du moteur choisi : le backend relaye en temps réel
- L'interface est conçue pour tester rapidement plusieurs backends
- Le dossier `tritton_server/` contient la configuration Triton prévue par INFRA
- Le dossier `src/models/phi3_financial/` contient le modèle spécialisé finance

---

## Priorité immédiate

1. Tester LM Studio car il est déjà présent
2. S'assurer que le backend Node.js fonctionne
3. Vérifier la sélection `LM Studio` dans l'UI
4. Documenter la procédure et livrer une interface web prête

---

## Annexes

- Si l'équipe INFRA fournit une URL, ajoute-la dans `.env` et sélectionne `Serveur maison`
- Si Triton doit être utilisé, vérifie la configuration de `src/tritton_server/Dockerfile`
