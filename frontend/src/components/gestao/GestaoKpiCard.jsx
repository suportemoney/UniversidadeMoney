import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GestaoIcon from "./GestaoIcons";

export default function GestaoKpiCard({ icon, value, label, to, delay = 0 }) {
  const [display, setDisplay] = useState(0);
  const num = Number(value) || 0;

  useEffect(() => {
    if (num === 0) {
      setDisplay(0);
      return undefined;
    }
    const passos = 20;
    const incremento = num / passos;
    let atual = 0;
    const timer = setInterval(() => {
      atual += incremento;
      if (atual >= num) {
        setDisplay(num);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(atual));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [num]);

  const conteudo = (
  <>
    <div className="gestao-kpi-icon">
      <GestaoIcon name={icon} />
    </div>
    <strong className="gestao-kpi-value">{display}</strong>
    <span className="gestao-kpi-label">{label}</span>
  </>
  );

  const style = { animationDelay: `${delay}ms` };

  if (to) {
    return (
      <Link to={to} className="gestao-kpi-card gestao-animate-in" style={style}>
        {conteudo}
      </Link>
    );
  }

  return (
    <div className="gestao-kpi-card gestao-animate-in" style={style}>
      {conteudo}
    </div>
  );
}
