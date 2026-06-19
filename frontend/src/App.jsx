import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function App() {
  const [status, setStatus] = useState("carregando...");
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/health/`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setStatus(data.status))
      .catch((err) => setErro(err.message));
  }, []);

  return (
    <div className="app">
      <h1>UniversidadeMoney</h1>
      <p>Sistema em construção.</p>
      <div className="status-card">
        <strong>API:</strong>{" "}
        {erro ? (
          <span className="erro">erro — {erro}</span>
        ) : (
          <span className="ok">{status}</span>
        )}
      </div>
    </div>
  );
}

export default App;
