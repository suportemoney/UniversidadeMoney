import { useEffect, useState } from "react";

function formatCountdown(dataFim) {
  const diff = new Date(dataFim).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export default function LandingTopBar({ faixa }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!faixa?.exibir_countdown || !faixa?.data_fim_countdown) {
      setCountdown(null);
      return undefined;
    }
    const tick = () => setCountdown(formatCountdown(faixa.data_fim_countdown));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [faixa]);

  if (!faixa?.mensagem) return null;

  const botao = faixa.texto_botao && faixa.url_botao ? (
    <a href={faixa.url_botao} className="landing-topbar-cta">
      {faixa.texto_botao} →
    </a>
  ) : null;

  return (
    <div className="landing-topbar">
      <div className="landing-container landing-topbar-inner">
        <span className="landing-topbar-msg">{faixa.mensagem}</span>
        {countdown && (
          <div className="landing-countdown" aria-live="polite">
            <span>{String(countdown.h).padStart(2, "0")}</span>
            <small>h</small>
            <span>{String(countdown.m).padStart(2, "0")}</span>
            <small>m</small>
            <span>{String(countdown.s).padStart(2, "0")}</span>
            <small>s</small>
          </div>
        )}
        {botao}
      </div>
    </div>
  );
}
