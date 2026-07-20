import { useState } from "react";

const FAQ = [
  {
    pergunta: "Preciso pagar para usar a plataforma?",
    resposta:
      "Não. O acesso é exclusivo para colaboradores Money e clientes com negócio fechado. Não há compra ou assinatura online.",
  },
  {
    pergunta: "Como recebo meu código de acesso?",
    resposta:
      "Após o cadastro, a equipe responsável libera um token (código UM-XXXX) vinculado ao seu plano. Você ativa em \"Ativar plano\" no painel.",
  },
  {
    pergunta: "Qual a diferença entre os planos?",
    resposta:
      "Cada plano define quais módulos estão disponíveis — cursos, trilhas, ao vivo — além de biblioteca, certificados e comunicados que são padrão.",
  },
  {
    pergunta: "Sou cliente externo, posso me cadastrar?",
    resposta:
      "Sim, mas o acesso ao conteúdo só é liberado após a Money conceder um token. Entre em contato com seu representante comercial.",
  },
  {
    pergunta: "Os treinamentos ao vivo são presenciais?",
    resposta:
      "Por enquanto são transmissões online via Google Meet ou YouTube Live, com link disponível na agenda da plataforma.",
  },
];

export default function LandingFaq() {
  const [aberto, setAberto] = useState(0);

  return (
    <section id="faq" className="landing-faq">
      <div className="landing-container landing-faq-inner">
        <h2>Perguntas frequentes</h2>
        <div className="landing-faq-list">
          {FAQ.map((item, i) => {
            const expandido = aberto === i;
            return (
              <div key={item.pergunta} className={`landing-faq-item${expandido ? " landing-faq-item--open" : ""}`}>
                <button
                  type="button"
                  className="landing-faq-trigger"
                  onClick={() => setAberto(expandido ? -1 : i)}
                  aria-expanded={expandido}
                >
                  <span className="landing-faq-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="landing-faq-pergunta">{item.pergunta}</span>
                  <span className="landing-faq-chevron">{expandido ? "▲" : "▼"}</span>
                </button>
                {expandido && <div className="landing-faq-resposta">{item.resposta}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
