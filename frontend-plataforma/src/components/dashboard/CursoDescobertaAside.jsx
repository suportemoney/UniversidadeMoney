import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAoVivo, getCatalogoCursos, getTrilhas } from "../../services/api";

function formatLiveData(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Coluna direita: cursos/trilhas relacionados e lives.
 * Falhas de feature/plano em cada bloco são ignoradas (seção some).
 */
export default function CursoDescobertaAside({
  excludeCursoId,
  setorPreferido,
  className = "",
}) {
  const [cursos, setCursos] = useState([]);
  const [trilhas, setTrilhas] = useState([]);
  const [lives, setLives] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.allSettled([getCatalogoCursos(), getTrilhas(), getAoVivo()]).then((res) => {
      if (!ativo) return;
      const [cRes, tRes, lRes] = res;
      setCursos(cRes.status === "fulfilled" && Array.isArray(cRes.value) ? cRes.value : []);
      setTrilhas(tRes.status === "fulfilled" && Array.isArray(tRes.value) ? tRes.value : []);
      setLives(lRes.status === "fulfilled" && Array.isArray(lRes.value) ? lRes.value : []);
      setReady(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const cursosRelacionados = useMemo(() => {
    const excluir = Number(excludeCursoId);
    const outros = cursos.filter((c) => Number(c.id) !== excluir);
    if (!outros.length) return [];
    const setor = (setorPreferido || "").toLowerCase();
    const mesmoSetor = setor
      ? outros.filter((c) => String(c.setor_nome || c.setor || "").toLowerCase() === setor)
      : [];
    const base = mesmoSetor.length ? mesmoSetor : outros;
    return base.slice(0, 4);
  }, [cursos, excludeCursoId, setorPreferido]);

  const trilhasRelacionadas = useMemo(() => {
    if (!trilhas.length) return [];
    const setor = (setorPreferido || "").toLowerCase();
    const mesmoSetor = setor
      ? trilhas.filter((t) => String(t.setor || "").toLowerCase() === setor)
      : [];
    const base = mesmoSetor.length ? mesmoSetor : trilhas;
    return base.slice(0, 3);
  }, [trilhas, setorPreferido]);

  const proximasLives = useMemo(() => lives.slice(0, 3), [lives]);

  const vazio =
    ready &&
    !cursosRelacionados.length &&
    !trilhasRelacionadas.length &&
    !proximasLives.length;

  return (
    <aside className={`dash-descoberta ${className}`.trim()} aria-label="Descubra mais">
      <div className="dash-descoberta-card dash-descoberta-card--intro">
        <h2>Continue explorando</h2>
        <p>Outros cursos, trilhas e lives para complementar este conteúdo.</p>
      </div>

      <section className="dash-descoberta-card" aria-labelledby="descoberta-cursos">
        <div className="dash-descoberta-head">
          <h3 id="descoberta-cursos">Cursos relacionados</h3>
          <Link to="/dashboard/explorar" className="dash-descoberta-more">
            Ver todos
          </Link>
        </div>
        {!ready && <p className="dash-descoberta-loading">Carregando…</p>}
        {ready && !cursosRelacionados.length && (
          <p className="dash-descoberta-empty">Nenhum outro curso disponível agora.</p>
        )}
        <ul className="dash-descoberta-list">
          {cursosRelacionados.map((c) => (
            <li key={c.id}>
              <Link to={`/dashboard/curso/${c.id}`} className="dash-descoberta-item">
                <span className="dash-descoberta-thumb" aria-hidden>
                  {c.is_novo ? "N" : "UM"}
                </span>
                <span className="dash-descoberta-item-body">
                  <strong>{c.titulo}</strong>
                  <small>
                    {c.setor_nome || c.setor || "Geral"}
                    {c.total_modulos != null ? ` · ${c.total_modulos} módulos` : ""}
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="dash-descoberta-card" aria-labelledby="descoberta-trilhas">
        <div className="dash-descoberta-head">
          <h3 id="descoberta-trilhas">Trilhas relacionadas</h3>
          <Link to="/dashboard/trilhas" className="dash-descoberta-more">
            Ver trilhas
          </Link>
        </div>
        {!ready && <p className="dash-descoberta-loading">Carregando…</p>}
        {ready && !trilhasRelacionadas.length && (
          <p className="dash-descoberta-empty">Nenhuma trilha no momento.</p>
        )}
        <ul className="dash-descoberta-list">
          {trilhasRelacionadas.map((t) => (
            <li key={t.id}>
              <Link to={`/dashboard/trilhas/${t.id}`} className="dash-descoberta-item">
                <span className="dash-descoberta-thumb dash-descoberta-thumb--trilha" aria-hidden>
                  ↠
                </span>
                <span className="dash-descoberta-item-body">
                  <strong>{t.titulo}</strong>
                  <small>
                    {t.setor || "Geral"}
                    {t.total_cursos != null ? ` · ${t.total_cursos} cursos` : ""}
                    {t.progresso != null ? ` · ${t.progresso}%` : ""}
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="dash-descoberta-card dash-descoberta-card--live" aria-labelledby="descoberta-lives">
        <div className="dash-descoberta-head">
          <h3 id="descoberta-lives">Nossas lives</h3>
          <Link to="/dashboard/ao-vivo" className="dash-descoberta-more">
            Ver agenda
          </Link>
        </div>
        {!ready && <p className="dash-descoberta-loading">Carregando…</p>}
        {ready && !proximasLives.length && (
          <p className="dash-descoberta-empty">Sem lives próximas — confira a agenda depois.</p>
        )}
        <ul className="dash-descoberta-list">
          {proximasLives.map((l) => (
            <li key={l.id}>
              <Link to="/dashboard/ao-vivo" className="dash-descoberta-item">
                <span className="dash-descoberta-live-date" aria-hidden>
                  <strong>{formatLiveData(l.data)}</strong>
                  <small>{l.hora || ""}</small>
                </span>
                <span className="dash-descoberta-item-body">
                  <strong>{l.titulo}</strong>
                  <small>
                    {l.tipo_plataforma === "youtube" ? "YouTube Live" : "Google Meet"}
                    {l.setor ? ` · ${l.setor}` : ""}
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {vazio && (
        <div className="dash-descoberta-card">
          <p className="dash-descoberta-empty">
            Explore o catálogo e a agenda ao vivo para descobrir mais conteúdos.
          </p>
          <div className="dash-descoberta-links">
            <Link to="/dashboard/explorar" className="btn btn-outline btn-sm">
              Explorar cursos
            </Link>
            <Link to="/dashboard/ao-vivo" className="btn btn-outline btn-sm">
              Ver lives
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
