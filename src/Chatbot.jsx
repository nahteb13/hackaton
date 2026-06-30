import React, { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'IA',
      text: 'Bonjour ! Je suis votre nouvel assistant. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'Vous',
      text: input.trim(),
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
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const answer = data?.reply || data?.message || data?.answer || 'Réponse vide reçue du serveur.';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'IA',
          text: answer,
          isUser: false,
        },
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'appel API:', error);
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
    <div className="chatbot-shell">
      <header className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-status" aria-hidden="true" />
          <h1>Assistant IA v1.0</h1>
        </div>
        <span className="chatbot-badge">FictivCorp</span>
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
        <form onSubmit={handleSubmit} className="chatbot-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message ici..."
            className="chatbot-input"
            disabled={isLoading}
            autoComplete="off"
            required
          />
          <button type="submit" disabled={isLoading} className="chatbot-button">
            Envoyer
          </button>
        </form>
      </footer>
    </div>
  );
}
