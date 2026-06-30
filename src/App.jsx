import './App.css'
import { useState } from 'react'
import OllamaChatbot from './ollama_server/Chatbot'
import TritonChatbot from './tritton_server/Chatbot'

const SERVER_CHOICES = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'triton', label: 'Triton' },
]

function App() {
  const [provider, setProvider] = useState('ollama')
  const ActiveChatbot = provider === 'triton' ? TritonChatbot : OllamaChatbot

  return (
    <div className="app-shell">
      <div className="app-header">
        <label htmlFor="provider-select">Serveur d'inférence</label>
        <select
          id="provider-select"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          {SERVER_CHOICES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <ActiveChatbot />
    </div>
  )
}

export default App
