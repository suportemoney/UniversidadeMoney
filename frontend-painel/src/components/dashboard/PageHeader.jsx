import { useEffect, useState } from "react";

/** Contador animado para métricas */
export function AnimatedNumber({ value, suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const alvo = Number(value) || 0;
    const duracao = 700;
    const inicio = performance.now();

    const tick = (agora) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const ease = 1 - (1 - progresso) ** 3;
      const atual = alvo * ease;
      setDisplay(decimals > 0 ? Number(atual.toFixed(decimals)) : Math.round(atual));
      if (progresso < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, decimals]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

/** Cabeçalho padronizado das páginas do dashboard */
export default function PageHeader({ icon, titulo, subtitulo, children }) {
  return (
    <header className="dash-page-header">
      <div className="dash-page-header-main">
        {icon && <span className="dash-page-icon" aria-hidden="true">{icon}</span>}
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p className="dash-page-subtitle">{subtitulo}</p>}
        </div>
      </div>
      {children && <div className="dash-page-header-actions">{children}</div>}
    </header>
  );
}
