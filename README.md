# TechCorp AI Chat — Assistant Financier Spécialisé

## Objectif
Déploiement d'une interface web de chat connectée à un modèle d'IA spécialisé en finance (**phi3.5:Financial**) via le serveur d'inférence **Ollama**.

Le frontend React interroge un backend Node.js (`server.js`) qui communique avec Ollama (`http://localhost:11434`).

## Présentation de l'équipe

Développement Full-Stack : INSA NAKIB Elamine & BERMOND Ethan

Data Science & Engineering : YAKOUBI Al Eddine

Cybersécurité : MIZOURI Rayane

Intelligence Artificielle : BOUCHARD Corentin & MOLINIERES Damien

## Structure du projet

```
techcorp-ai-chat/
├── server.js             # Backend Node.js (Proxy API)
├── .env                  # Configuration des URLs et modèles
├── src/
│   ├── App.jsx           # Entrée frontend
│   ├── shared/
│   │   └── ChatbotBase.jsx  # Composant de chat générique (avec réglage température)
│   ├── ollama_server/
│   │   ├── Chatbot.jsx   # Implémentation spécifique Ollama
│   │   └── Modelfile     # Configuration du modèle financier (instructions & paramètres)
│   └── models/           # Poids du modèle et adaptateurs financiers
└── README.md
```

## Installation et Utilisation

### 1. Préparer l'environnement

Assurez-vous qu'Ollama est installé sur votre machine.

```bash
# Installation des dépendances Node.js
npm install

# Copie du fichier d'exemple si nécessaire
cp .env.example .env
```

Vérifiez que le `.env` contient :
- `OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3.5`

### 2. Configurer le modèle spécialisé

Dans le dossier `src/ollama_server/`, créez le modèle personnalisé TechCorp :

```bash
ollama create phi3.5 -f Modelfile
```

### 3. Lancer le backend

```bash
npm run backend
```
Le backend démarrera sur `http://localhost:5000` et affichera l'adresse d'Ollama.

### 4. Lancer le frontend

```bash
npm run dev
```

Ouvrez ensuite `http://localhost:5173` pour interagir avec l'assistant.

---

## Fonctionnalités Clés

- **Modèle Spécialisé** : Utilise `phi3.5` boosté par des instructions financières spécifiques.
- **Réglage de Température** : Slider intégré dans l'UI pour ajuster la créativité du modèle (0.2 recommandé pour la précision financière).
- **Validation métier** : Corrections automatiques des termes techniques (ex: Mortgage -> Hypothécaire).

---

## Validation du fonctionnement

- **Vérification Ollama** : `ollama list` doit afficher `phi3.5`.
- **Vérification Backend** : Le log doit indiquer `Ollama tourne sur l'adresse: http://localhost:11434`.
- **Vérification Chat** : Les réponses dans l'interface doivent porter le suffixe `(ollama)`.

---

## Challenge IA - TechCorp Industries
Ce projet a été finalisé dans le cadre du Challenge IA 7h pour répondre à la mission critique de déploiement d'un assistant financier "Production Ready".
