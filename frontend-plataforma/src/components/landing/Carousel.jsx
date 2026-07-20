import { useCallback, useEffect, useState } from "react";

/**
 * Carrossel genérico com auto-play, setas e indicadores.
 */
export default function Carousel({
  items,
  renderSlide,
  autoPlayMs = 6000,
  className = "",
  slideClassName = "",
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  const goTo = useCallback(
    (next) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (!autoPlayMs || total <= 1 || paused) return undefined;
    const id = setInterval(() => goTo(index + 1), autoPlayMs);
    return () => clearInterval(id);
  }, [index, autoPlayMs, total, paused, goTo]);

  if (total === 0) return null;

  return (
    <div
      className={`landing-carousel ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="landing-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {items.map((item, i) => (
          <div key={item.id ?? i} className={`landing-carousel-slide ${slideClassName}`}>
            {renderSlide(item, i)}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="landing-carousel-arrow landing-carousel-arrow--prev"
            aria-label="Anterior"
            onClick={() => goTo(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="landing-carousel-arrow landing-carousel-arrow--next"
            aria-label="Próximo"
            onClick={() => goTo(index + 1)}
          >
            ›
          </button>
          <div className="landing-carousel-dots">
            {items.map((item, i) => (
              <button
                key={item.id ?? i}
                type="button"
                className={`landing-carousel-dot${i === index ? " landing-carousel-dot--active" : ""}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
