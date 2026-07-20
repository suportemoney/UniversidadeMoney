const STATS = [
  { icon: "📚", valor: "Cursos", desc: "Conteúdo sob demanda para sua equipe." },
  { icon: "🛤️", valor: "Trilhas", desc: "Jornadas guiadas de aprendizado." },
  { icon: "🏅", valor: "Certificados", desc: "Comprove o progresso ao concluir." },
];

export default function LandingStats() {
  return (
    <section className="landing-stats">
      <div className="landing-container landing-stats-grid">
        <div className="landing-stats-cards">
          {STATS.map((s) => (
            <article key={s.valor} className="landing-stat-card">
              <span className="landing-stat-icon">{s.icon}</span>
              <strong>{s.valor}</strong>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
        <div className="landing-stats-highlight">
          <span className="landing-section-label">Nosso impacto</span>
          <strong className="landing-stats-big">+100%</strong>
          <p>
            Foco em capacitação prática para colaboradores internos e clientes
            que fecharam negócio com a Money — sem cobrança na plataforma.
          </p>
        </div>
      </div>
    </section>
  );
}
