const FEATURES = [
  { icon: "📚", titulo: "Cursos online", desc: "Aprenda no seu ritmo com conteúdo sempre disponível." },
  { icon: "🛤️", titulo: "Trilhas de carreira", desc: "Percursos organizados para evolução profissional." },
  { icon: "🎥", titulo: "Treinamentos ao vivo", desc: "Encontros via Google Meet ou YouTube Live." },
  { icon: "🏅", titulo: "Certificados", desc: "Valide seu progresso ao concluir os módulos." },
];

export default function LandingFeatures() {
  return (
    <section id="beneficios" className="landing-features">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-label">Benefícios</span>
          <h2>Tudo para evoluir na Money</h2>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <article key={f.titulo} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h3>{f.titulo}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
