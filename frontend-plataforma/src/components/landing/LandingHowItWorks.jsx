const PASSOS = [
  {
    num: "01",
    titulo: "Crie sua conta",
    desc: "Cadastre-se gratuitamente na plataforma com seus dados corporativos.",
  },
  {
    num: "02",
    titulo: "Receba seu código",
    desc: "A equipe Money libera um token de acesso após o acordo ou vínculo interno.",
  },
  {
    num: "03",
    titulo: "Ative e aprenda",
    desc: "Resgate o código e acesse cursos, trilhas e treinamentos do seu plano.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="landing-steps">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-label">Como funciona</span>
          <h2>Três passos para começar</h2>
        </div>
        <div className="landing-steps-grid">
          {PASSOS.map((p) => (
            <article key={p.num} className="landing-step-card">
              <span className="landing-step-num">{p.num}</span>
              <h3>{p.titulo}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
