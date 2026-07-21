import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoKpiCard from "../../components/gestao/GestaoKpiCard";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoRecentList from "../../components/gestao/GestaoRecentList";
import GestaoStatusChart from "../../components/gestao/GestaoStatusChart";
import StatusBadge from "../../components/gestao/StatusBadge";
import { gestaoApi } from "../../services/gestaoApi";

const ICON_COMUNICADO = { info: "ℹ️", trofeu: "🏆", megafone: "📣" };

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDataHora(data, hora) {
  if (!data) return "";
  const d = new Date(`${data}T${hora || "00:00"}`);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const { kpis, cursos_por_status, ultimos_cursos, proximos_ao_vivo, ultimos_comunicados, alertas } = resumo;
  const temAlertas = alertas.rascunhos_pendentes > 0 || alertas.materiais_nao_publicados > 0;

  return (
    <div className="gestao-dashboard">
      <GestaoPageHeader
        icon="resumo"
        title="Resumo da gestão"
        subtitle="Visão geral da plataforma para tomada de decisão"
      />

      {temAlertas && (
        <div className="gestao-alert-banner gestao-animate-in">
          <strong>Pendências de publicação</strong>
          <span>
            {alertas.rascunhos_pendentes > 0 && (
              <>
                {alertas.rascunhos_pendentes} curso(s) em rascunho —{" "}
                <Link to="/gestao/cursos">revisar cursos</Link>
              </>
            )}
            {alertas.rascunhos_pendentes > 0 && alertas.materiais_nao_publicados > 0 && " · "}
            {alertas.materiais_nao_publicados > 0 && (
              <>
                {alertas.materiais_nao_publicados} material(is) não publicado(s) —{" "}
                <Link to="/gestao/biblioteca">revisar biblioteca</Link>
              </>
            )}
          </span>
        </div>
      )}

      <section className="gestao-dashboard-section">
        <h2 className="gestao-dashboard-section-title">Indicadores principais</h2>
        <div className="gestao-cards-v2 gestao-cards-v2--4">
          <GestaoKpiCard icon="cursos" value={kpis.cursos_publicados} label="Cursos publicados" to="/gestao/cursos" delay={0} />
          <GestaoKpiCard icon="cursos" value={kpis.cursos_rascunho} label="Rascunhos" to="/gestao/cursos" delay={40} />
          <GestaoKpiCard icon="trilhas" value={kpis.trilhas} label="Trilhas" to="/gestao/trilhas" delay={80} />
          <GestaoKpiCard icon="equipe" value={kpis.colaboradores_ativos} label="Colaboradores ativos" to="/gestao/equipe" delay={120} />
          <GestaoKpiCard icon="cursos" value={kpis.matriculas} label="Matrículas" to="/gestao/cursos" delay={160} />
          <GestaoKpiCard icon="comunicados" value={kpis.comunicados} label="Comunicados" to="/gestao/comunicados" delay={200} />
          <GestaoKpiCard icon="biblioteca" value={kpis.biblioteca_total} label="Materiais na biblioteca" to="/gestao/biblioteca" delay={240} />
          <GestaoKpiCard icon="api" value="—" label="Integração API" to="/gestao/api" delay={280} />
        </div>
      </section>

      <section className="gestao-dashboard-section">
        <h2 className="gestao-dashboard-section-title">Plataforma e acesso</h2>
        <div className="gestao-cards-v2 gestao-cards-v2--4">
          <GestaoKpiCard
            icon="aoVivo"
            value={kpis.ao_vivo_total}
            label="Treinamentos ao vivo"
            hint={kpis.ao_vivo_proximos ? `${kpis.ao_vivo_proximos} próximo(s)` : undefined}
            to="/gestao/ao-vivo"
            delay={0}
          />
          <GestaoKpiCard icon="setores" value={kpis.setores} label="Setores" to="/gestao/setores" delay={40} />
          <GestaoKpiCard icon="tags" value={kpis.tags_ativas} label="Tags ativas" to="/gestao/tags" delay={80} />
          <GestaoKpiCard icon="equipe" value={kpis.membros_equipe} label="Membros da equipe" to="/gestao/equipe" delay={120} />
          <GestaoKpiCard icon="tokens" value="—" label="Convites" to="/gestao/convites" delay={160} />
        </div>
      </section>

      <div className="gestao-dashboard-grid">
        <GestaoStatusChart title="Cursos por status" items={cursos_por_status} />
        <GestaoRecentList
          title="Próximos ao vivo"
          emptyText="Nenhum treinamento agendado."
          items={proximos_ao_vivo}
          footerLink="/gestao/ao-vivo"
          footerLabel="Gerenciar ao vivo"
          delay={80}
          renderItem={(item) => (
            <>
              <span className="gestao-recent-item-title">{item.titulo}</span>
              <span className="gestao-recent-item-meta">{formatDataHora(item.data, item.hora)}</span>
            </>
          )}
        />
      </div>

      <div className="gestao-dashboard-grid">
        <GestaoRecentList
          title="Últimos cursos"
          emptyText="Nenhum curso cadastrado."
          items={ultimos_cursos}
          footerLink="/gestao/cursos"
          footerLabel="Ver todos os cursos"
          delay={160}
          renderItem={(item) => (
            <Link to={`/gestao/cursos/${item.id}`} className="gestao-recent-item-link">
              <span className="gestao-recent-item-title">{item.titulo}</span>
              <span className="gestao-recent-item-meta">
                <StatusBadge status={item.status} />
                {" · "}
                {formatData(item.criado_em)}
              </span>
            </Link>
          )}
        />
        <GestaoRecentList
          title="Comunicados recentes"
          emptyText="Nenhum comunicado publicado."
          items={ultimos_comunicados}
          footerLink="/gestao/comunicados"
          footerLabel="Ver comunicados"
          delay={200}
          renderItem={(item) => (
            <>
              <span className="gestao-recent-item-title">
                {ICON_COMUNICADO[item.tipo] || "📢"} {item.titulo}
              </span>
              <span className="gestao-recent-item-meta">{formatData(item.criado_em)}</span>
            </>
          )}
        />
      </div>

      <section className="gestao-dashboard-section gestao-animate-in gestao-animate-in--delay-2">
        <h2 className="gestao-dashboard-section-title">Ações rápidas</h2>
        <div className="gestao-quick-actions">
          <Link to="/gestao/cursos" className="btn btn-primary gestao-btn-cta">
            <GestaoIcon name="mais" />
            Novo curso
          </Link>
          <Link to="/gestao/trilhas" className="btn btn-outline btn-sm">Gerenciar trilhas</Link>
          <Link to="/gestao/comunicados" className="btn btn-outline btn-sm">Comunicados</Link>
          <Link to="/gestao/biblioteca" className="btn btn-outline btn-sm">Biblioteca</Link>
          <Link to="/gestao/api" className="btn btn-outline btn-sm">API</Link>
          <Link to="/gestao/convites" className="btn btn-outline btn-sm">Convites</Link>
        </div>
      </section>
    </div>
  );
}
