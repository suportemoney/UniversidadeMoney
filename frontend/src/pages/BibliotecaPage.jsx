import { useEffect, useState } from "react";
import { getBiblioteca } from "../services/api";

export default function BibliotecaPage() {
  const [materiais, setMateriais] = useState([]);

  useEffect(() => {
    getBiblioteca().then(setMateriais);
  }, []);

  return (
    <div>
      <h1>Biblioteca</h1>
      <p className="dash-muted">Materiais em PDF hospedados na plataforma.</p>
      <ul className="dash-list">
        {materiais.map((m) => (
          <li key={m.id} className="dash-list-item">
            <span>📄</span>
            <div>
              <strong>{m.titulo}</strong>
              {m.descricao && <p>{m.descricao}</p>}
              {m.setor && <small>{m.setor}</small>}
            </div>
            {m.arquivo_url ? (
              <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                Visualizar / Baixar
              </a>
            ) : (
              <small>PDF indisponível</small>
            )}
          </li>
        ))}
        {materiais.length === 0 && <p>Nenhum material publicado.</p>}
      </ul>
    </div>
  );
}
