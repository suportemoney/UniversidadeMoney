import { useState } from "react";

const FAQ = [
  {
    q: "Como me matricular em um curso?",
    a: "Acesse Meus cursos ou Explorar cursos, escolha o curso desejado e clique em Continuar ou Matricular.",
  },
  {
    q: "Como obtenho meu certificado?",
    a: "Conclua todas as aulas obrigatórias e seja aprovado na prova final do curso. O certificado aparecerá em Certificados.",
  },
  {
    q: "Posso refazer uma prova?",
    a: "Sim, até o limite de tentativas definido pelo gestor do curso.",
  },
  {
    q: "Onde encontro materiais complementares?",
    a: "Na seção Biblioteca, com PDFs organizados por setor.",
  },
  {
    q: "Como me inscrever em treinamento ao vivo?",
    a: "Em Treinamentos ao vivo, clique em Inscrever-se no evento desejado.",
  },
];

export default function AjudaPage() {
  const [aberto, setAberto] = useState(0);

  return (
    <div>
      <h1>Ajuda e suporte</h1>
      <p className="dash-muted">
        Dúvidas sobre a plataforma? Consulte as perguntas frequentes ou entre em contato com o time de TI da Money Promotora.
      </p>

      <div className="dash-accordion">
        {FAQ.map((item, i) => (
          <div key={item.q} className="dash-accordion-item">
            <button
              type="button"
              className="dash-accordion-trigger"
              onClick={() => setAberto(aberto === i ? -1 : i)}
            >
              {item.q}
              <span>{aberto === i ? "−" : "+"}</span>
            </button>
            {aberto === i && <div className="dash-accordion-body">{item.a}</div>}
          </div>
        ))}
      </div>

      <section className="dash-panel" style={{ marginTop: "1.5rem" }}>
        <h2>Contato</h2>
        <p>E-mail: <a href="mailto:ti@moneypromotora.com.br">ti@moneypromotora.com.br</a></p>
        <p>Universidade Money — Money Promotora</p>
      </section>
    </div>
  );
}
