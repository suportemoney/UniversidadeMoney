import { Link } from "react-router-dom";
import Carousel from "./Carousel";

function BannerSlide({ banner }) {
  const inner = (
    <>
      <img src={banner.imagem_url} alt={banner.titulo || "Banner"} className="landing-hero-img" />
      {(banner.titulo || banner.subtitulo) && (
        <div className="landing-hero-overlay">
          {banner.titulo && <h1>{banner.titulo}</h1>}
          {banner.subtitulo && <p>{banner.subtitulo}</p>}
        </div>
      )}
    </>
  );

  if (banner.link) {
    return (
      <a href={banner.link} className="landing-hero-slide-link" target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <div className="landing-hero-slide">{inner}</div>;
}

export default function LandingHeroCarousel({ banners }) {
  if (!banners?.length) {
    return (
      <section className="landing-hero landing-hero--fallback">
        <div className="landing-container landing-hero-fallback-inner">
          <h1>Sua plataforma de aprendizado corporativo</h1>
          <p>
            Cursos, trilhas e treinamentos para colaboradores Money e clientes com acesso exclusivo.
          </p>
          <div className="landing-hero-actions">
            <Link to="/cadastro" className="btn btn-primary btn-lg">Criar conta</Link>
            <Link to="/login?next=/dashboard/ativar-plano" className="btn btn-outline btn-lg">
              Tenho um código
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="landing-hero">
      <Carousel
        items={banners}
        className="landing-hero-carousel"
        slideClassName="landing-hero-slide-wrap"
        autoPlayMs={7000}
        renderSlide={(banner) => <BannerSlide banner={banner} />}
      />
      <div className="landing-container landing-hero-cta-row">
        <Link to="/cadastro" className="btn btn-primary btn-lg">Começar agora</Link>
        <a href="#planos" className="btn btn-outline btn-lg">Conhecer planos</a>
      </div>
    </section>
  );
}
