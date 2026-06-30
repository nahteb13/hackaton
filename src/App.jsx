import './App.css';
import OllamaChatbot from './ollama_server/Chatbot';

function App() {
  return (
    <div className="app-shell">
      <div className="app-header">
      </div>
      
      <OllamaChatbot />
    </div>
  );
}

export default App;