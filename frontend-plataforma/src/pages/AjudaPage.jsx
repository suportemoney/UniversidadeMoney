import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/dashboard/PageHeader";

const FAQ = [
  {
    q: "Como me matricular em um curso?",
    a: "Acesse Meus cursos ou Explorar cursos, escolha o curso desejado e clique em Continuar ou Matricular.",
    icon: "📚",
  },
  {
    q: "Como obtenho meu certificado?",
    a: "Conclua todas as aulas obrigatórias e seja aprovado na prova final do curso. O certificado aparecerá em Certificados.",
    icon: "🏅",
  },
  {
    q: "Posso refazer uma prova?",
    a: "Sim, até o limite de tentativas definido pelo gestor do curso.",
    icon: "📝",
  },
  {
    q: "Onde encontro materiais complementares?",
    a: "Na seção Biblioteca, com PDFs organizados por setor.",
    icon: "📖",
  },
  {
    q: "Como me inscrever em treinamento ao vivo?",
    a: "Em Treinamentos ao vivo, clique em Inscrever-se no evento desejado.",
    icon: "🎥",
  },
];

export default function AjudaPage() {
  const [aberto, setAberto] = useState(0);

  return (
    <div className="dash-page">
      <PageHeader
        icon="❓"
        titulo="Ajuda e suporte"
        subtitulo="Dúvidas sobre a plataforma? Consulte o FAQ ou entre em contato."
      />

      <div className="dash-accordion">
        {FAQ.map((item, i) => (
          <div
            key={item.q}
            className={`dash-accordion-item${aberto === i ? " dash-accordion-item--open" : ""}`}
            style={{ animationDelay: `${i * 50}ms`, animation: "dashCardIn 0.4s ease backwards" }}
          >
            <button
              type="button"
              className="dash-accordion-trigger"
              onClick={() => setAberto(aberto === i ? -1 : i)}
            >
              <span>{item.icon} {item.q}</span>
              <span>+</span>
            </button>
            {aberto === i && <div className="dash-accordion-body">{item.a}</div>}
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        <section className="dash-panel dash-help-contact">
          <h2>Precisa de ajuda?</h2>
          <p>Nossa equipe de suporte está pronta para auxiliar você.</p>
          <p>
            E-mail:{" "}
            <a href="mailto:suporte@moneypromotora.com.br">suporte@moneypromotora.com.br</a>
          </p>
          <p>
            WhatsApp:{" "}
            <a href="https://wa.me/5551981051377" target="_blank" rel="noopener noreferrer">
              (51) 9 8105-1377
            </a>
          </p>
          <p>Universidade Money — Money Promotora</p>
        </section>

        <section className="dash-panel">
          <h2>Links úteis</h2>
          <ul className="dash-list">
            <li className="dash-list-item">
              <span>📚</span>
              <Link to="/dashboard/explorar">Explorar cursos</Link>
            </li>
            <li className="dash-list-item">
              <span>📈</span>
              <Link to="/dashboard/progresso">Meu progresso</Link>
            </li>
            <li className="dash-list-item">
              <span>🏅</span>
              <Link to="/dashboard/certificados">Meus certificados</Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
