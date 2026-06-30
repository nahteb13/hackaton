import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotBase({
  title = 'Assistant IA v1.0',
  badge = 'FictivCorp',
  platform = 'backend',
  platformLabel = 'Backend local',
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'IA',
      text: "Bonjour ! Je suis votre nouvel assistant. Comment puis-je vous aider aujourd'hui ?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }

    if (!isOpen) {
      setIsOpen(true);
    }

    const userMessage = {
      id: Date.now(),
      sender: 'Vous',
      text: trimmedInput,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text, platform }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.reply || data?.message || data?.answer || data?.output || 'Réponse vide reçue du serveur.';
      const source = data?.platform ? ` (${data.platform})` : '';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'IA',
          text: `${answer}${source}`,
          isUser: false,
        },
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'appel API :', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'IA',
          text: 'Impossible de contacter le backend. Vérifiez que votre API est démarrée et que VITE_API_URL est correctement configuré.',
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatbot-shell ${isOpen ? 'is-open' : 'is-closed'}`}>
      {!isOpen ? (
        <div className="chatbot-landing">
          <div className="chatbot-landing-card">
            <div className="chatbot-landing-header">
              <div className="chatbot-title">
                <span className="chatbot-status" aria-hidden="true" />
                <h1 className="chatbot-title-text">{title}</h1>
              </div>
              <span className="chatbot-badge">{badge}</span>
            </div>

            <div className="chatbot-landing-body">
              <p className="chatbot-landing-eyebrow">Assistant IA</p>
              <h2>Posez votre question en toute simplicité</h2>
              <p className="chatbot-landing-copy">{messages[0]?.text}</p>
            </div>

            <form className="chatbot-landing-cta" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question au modèle financier..."
                className="chatbot-landing-placeholder"
                autoComplete="off"
                required
              />
              <button type="submit" className="chatbot-landing-arrow" aria-label="Envoyer la question">
                →
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="chatbot-panel">
          <header className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-status" aria-hidden="true" />
              <h1 className="chatbot-title-text">{title}</h1>
            </div>
            <span className="chatbot-badge">{badge}</span>
          </header>

          <main className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.isUser ? 'chatbot-user' : 'chatbot-bot'}`}
              >
                <div className="message-sender">{message.sender}</div>
                <div className="message-text">{message.text}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message chatbot-bot chatbot-loading">
                <span className="loading-dot" />
                <span className="loading-dot" style={{ animationDelay: '150ms' }} />
                <span className="loading-dot" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          <footer className="chatbot-footer">
            <div className="chatbot-hint">Serveur d'inférence : {platformLabel}</div>
            <form onSubmit={handleSubmit} className="chatbot-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question au modèle financier..."
                className="chatbot-input"
                disabled={isLoading}
                autoComplete="off"
                required
                autoFocus
              />
              <button type="submit" disabled={isLoading} className="chatbot-button">
                Envoyer
              </button>
            </form>
          </footer>
        </div>
      )}
    </div>
  );
}
