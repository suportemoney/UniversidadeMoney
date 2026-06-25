import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoKpiCard from "../../components/gestao/GestaoKpiCard";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoHomePage() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gestaoApi.resumo()
      .then(setResumo)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="gestao-loading">Carregando resumo...</p>;
  }

  if (!resumo) return null;

  return (
    <div>
      <GestaoPageHeader
        icon="resumo"
        title="Resumo da gestão"
        subtitle="Visão geral do conteúdo da plataforma"
      />

      <div className="gestao-cards-v2">
        <GestaoKpiCard
          icon="cursos"
          value={resumo.cursos_publicados}
          label="Cursos publicados"
          to="/gestao/cursos"
          delay={0}
        />
        <GestaoKpiCard
          icon="cursos"
          value={resumo.cursos_rascunho}
          label="Rascunhos"
          to="/gestao/cursos"
          delay={80}
        />
        <GestaoKpiCard
          icon="trilhas"
          value={resumo.trilhas}
          label="Trilhas"
          to="/gestao/trilhas"
          delay={160}
        />
      </div>

      <div className="gestao-quick-actions gestao-animate-in gestao-animate-in--delay-2">
        <Link to="/gestao/cursos" className="btn btn-primary gestao-btn-cta">
          <GestaoIcon name="mais" />
          Novo curso
        </Link>
        <Link to="/gestao/trilhas" className="btn btn-outline btn-sm">Gerenciar trilhas</Link>
        <Link to="/gestao/comunicados" className="btn btn-outline btn-sm">Comunicados</Link>
      </div>
    </div>
  );
}
