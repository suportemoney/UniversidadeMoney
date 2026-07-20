import { Link } from "react-router-dom";
import Carousel from "./Carousel";

function PlanoCard({ plano, destaque }) {
  return (
    <article className={`landing-plan-card${destaque ? " landing-plan-card--destaque" : ""}`}>
      {destaque && <span className="landing-plan-badge">Mais completo</span>}
      <h3>{plano.titulo}</h3>
      <p className="landing-plan-desc">{plano.descricao || "Plano corporativo com acesso sob convite."}</p>
      <span className="landing-plan-tag">Acesso corporativo</span>
      <ul className="landing-plan-modulos">
        {plano.modulos?.map((m) => (
          <li key={m}>✓ {m}</li>
        ))}
      </ul>
      <div className="landing-plan-actions">
        <Link
          to="/login?next=/dashboard/ativar-plano"
          className="btn btn-primary btn-sm"
        >
          Tenho um código
        </Link>
        <Link to="/cadastro" className="btn btn-outline btn-sm">Criar conta</Link>
      </div>
    </article>
  );
}

export default function LandingPlansCarousel({ planos }) {
  if (!planos?.length) {
    return (
      <section id="planos" className="landing-plans">
        <div className="landing-container landing-section-header">
          <span className="landing-section-label">Planos</span>
          <h2>Acesso por convite</h2>
          <p>
            Não há compra online. Seu plano é liberado pela equipe Money após cadastro e ativação do código.
          </p>
          <Link to="/cadastro" className="btn btn-primary">Criar conta</Link>
        </div>
      </section>
    );
  }

  const destaqueIndex = planos.length > 1 ? 1 : 0;

  if (planos.length <= 3) {
    return (
      <section id="planos" className="landing-plans">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-label">Planos</span>
            <h2>Escolha o acesso ideal para você</h2>
            <p>Sem valores — o acesso é concedido por token após acordo comercial ou vínculo interno.</p>
          </div>
          <div className="landing-plans-grid">
            {planos.map((p, i) => (
              <PlanoCard key={p.id} plano={p} destaque={i === destaqueIndex} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="planos" className="landing-plans">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-label">Planos</span>
          <h2>Escolha o acesso ideal para você</h2>
          <p>Sem valores — o acesso é concedido por token após acordo comercial ou vínculo interno.</p>
        </div>
        <Carousel
          items={planos.map((p, i) => ({ ...p, destaque: i === destaqueIndex }))}
          className="landing-plans-carousel"
          slideClassName="landing-plan-slide"
          autoPlayMs={8000}
          renderSlide={(plano) => <PlanoCard plano={plano} destaque={plano.destaque} />}
        />
      </div>
    </section>
  );
}
