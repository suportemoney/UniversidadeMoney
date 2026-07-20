export default function LandingSocialProof() {
  return (
    <section className="landing-social">
      <div className="landing-container landing-social-inner">
        <div className="landing-social-badge">
          <span className="landing-social-icon">✓</span>
          <div>
            <strong>Plataforma corporativa</strong>
            <p>Acesso exclusivo para colaboradores e parceiros Money Promotora.</p>
          </div>
        </div>
        <div className="landing-social-avatars" aria-hidden="true">
          {["A", "B", "C", "D", "E"].map((l) => (
            <span key={l} className="landing-avatar">{l}</span>
          ))}
        </div>
        <p className="landing-social-text">
          Junte-se a quem já evolui com treinamentos sob medida para o negócio.
        </p>
      </div>
    </section>
  );
}
