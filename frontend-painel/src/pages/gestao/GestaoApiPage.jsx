import { useCallback, useEffect, useMemo, useState } from "react";
import GestaoDataTable, { GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import StatusBadge from "../../components/gestao/StatusBadge";
import { gestaoApi } from "../../services/gestaoApi";

function resolverApiUrlExemplo() {
  if (typeof window === "undefined") {
    return "https://plataforma.moneypromotora.com.br/api";
  }
  const env = import.meta.env.VITE_API_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  return `${window.location.protocol}//${window.location.hostname}:8000/api`;
}

const PASSOS_TOKEN = [
  {
    titulo: "Gerar token_temp",
    texto: "Válido por ~30 min e de uso único. Copie na hora.",
  },
  {
    titulo: "Trocar no outro sistema",
    texto: "POST /api/auth/api-tokens/trocar/ com token_temp + usuário gestor + senha.",
  },
  {
    titulo: "Guardar token_perm",
    texto: "Exibido uma vez — salve no .env como UNIVERSIDADE_API_TOKEN.",
  },
  {
    titulo: "Chamar a API",
    texto: "Header Authorization: Bearer um_... em todas as rotas (exceto a troca).",
  },
];

function formatData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

function MetodoBadge({ metodo }) {
  const m = (metodo || "").toUpperCase();
  const cls =
    m === "POST"
      ? "gestao-api-method gestao-api-method--post"
      : m === "PATCH" || m === "PUT"
        ? "gestao-api-method gestao-api-method--patch"
        : m === "DELETE"
          ? "gestao-api-method gestao-api-method--delete"
          : "gestao-api-method gestao-api-method--get";
  return <span className={cls}>{m}</span>;
}

function jsonPretty(obj) {
  return JSON.stringify(obj, null, 2);
}

function snippetRequests(baseUrl, exemplo) {
  const pathRel = exemplo.path.replace(/^\/api/, "") || exemplo.path;
  const headers = exemplo.auth
    ? `headers = {\n    "Authorization": f"Bearer {token}",\n    "Content-Type": "application/json",\n}\n`
    : `headers = {"Content-Type": "application/json"}\n`;

  if ((exemplo.metodo || "GET").toUpperCase() === "GET") {
    return `import os
import requests

base = os.environ["UNIVERSIDADE_API_URL"]  # ex.: ${baseUrl}
token = os.environ["UNIVERSIDADE_API_TOKEN"]  # um_...

${headers}
resp = requests.get(f"{base}${pathRel}", headers=headers, timeout=30)
resp.raise_for_status()
print(resp.json())`;
  }

  const body = exemplo.body ? jsonPretty(exemplo.body) : "{}";
  return `import os
import requests

base = os.environ["UNIVERSIDADE_API_URL"]  # ex.: ${baseUrl}
${exemplo.auth ? 'token = os.environ["UNIVERSIDADE_API_TOKEN"]  # um_...\n' : ""}
${headers}
payload = ${body}
resp = requests.post(
    f"{base}${pathRel}",
    headers=headers,
    json=payload,
    timeout=30,
)
resp.raise_for_status()
print(resp.json())`;
}

function snippetHttpClient(baseUrl, exemplo) {
  const pathOnly = exemplo.path.startsWith("/api")
    ? exemplo.path
    : `/api${exemplo.path.startsWith("/") ? "" : "/"}${exemplo.path}`;
  // baseUrl tipicamente .../api — http.client precisa host + path completo
  let host = "localhost";
  let port = 8000;
  let useSsl = false;
  try {
    const u = new URL(baseUrl.includes("://") ? baseUrl : `http://${baseUrl}`);
    host = u.hostname;
    port = u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
    useSsl = u.protocol === "https:";
  } catch {
    /* ignore */
  }

  const authLines = exemplo.auth
    ? `    "Authorization": f"Bearer {os.environ['UNIVERSIDADE_API_TOKEN']}",\n`
    : "";
  const method = (exemplo.metodo || "GET").toUpperCase();
  const body = exemplo.body ? jsonPretty(exemplo.body) : null;

  if (method === "GET") {
    return `import os
import json
import http.client

conn = http.client.${useSsl ? "HTTPSConnection" : "HTTPConnection"}("${host}", ${port}, timeout=30)
headers = {
${authLines}    "Accept": "application/json",
}
conn.request("GET", "${pathOnly}", headers=headers)
resp = conn.getresponse()
print(resp.status, json.loads(resp.read().decode()))
conn.close()`;
  }

  return `import os
import json
import http.client

conn = http.client.${useSsl ? "HTTPSConnection" : "HTTPConnection"}("${host}", ${port}, timeout=30)
payload = ${body || "{}"}
body = json.dumps(payload).encode()
headers = {
${authLines}    "Content-Type": "application/json",
    "Accept": "application/json",
}
conn.request("POST", "${pathOnly}", body=body, headers=headers)
resp = conn.getresponse()
print(resp.status, json.loads(resp.read().decode()))
conn.close()`;
}

function gerarSnippet(modelo, baseUrl, exemplo) {
  if (!exemplo) return "";
  return modelo === "http.client"
    ? snippetHttpClient(baseUrl, exemplo)
    : snippetRequests(baseUrl, exemplo);
}

export default function GestaoApiPage() {
  const apiUrl = useMemo(() => resolverApiUrlExemplo(), []);
  const envSnippet = `UNIVERSIDADE_API_URL=${apiUrl}\nUNIVERSIDADE_API_TOKEN=um_...`;

  const [guia, setGuia] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [gerando, setGerando] = useState(false);
  const [tokenTemp, setTokenTemp] = useState(null);
  const [copiado, setCopiado] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("Todos");
  const [modeloPy, setModeloPy] = useState("requests");
  const [exemploAtivo, setExemploAtivo] = useState("trocar");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const [cat, lista] = await Promise.all([
        gestaoApi.catalogoApiDocs(),
        gestaoApi.listarApiTokens(),
      ]);
      setGuia(cat?.guia || null);
      setCatalogo(Array.isArray(cat?.endpoints) ? cat.endpoints : []);
      setTokens(Array.isArray(lista) ? lista : []);
      if (cat?.guia?.exemplos?.[0]?.id) {
        setExemploAtivo(cat.guia.exemplos[0].id);
      }
    } catch (err) {
      setErro(err.message || "Falha ao carregar a aba API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const grupos = useMemo(() => {
    const set = new Set(catalogo.map((e) => e.grupo).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [catalogo]);

  const catalogoFiltrado = useMemo(() => {
    if (filtroGrupo === "Todos") return catalogo;
    return catalogo.filter((e) => e.grupo === filtroGrupo);
  }, [catalogo, filtroGrupo]);

  const exemplos = guia?.exemplos || [];
  const exemploSel = exemplos.find((e) => e.id === exemploAtivo) || exemplos[0];
  const codigoPy = useMemo(
    () => gerarSnippet(modeloPy, apiUrl, exemploSel),
    [modeloPy, apiUrl, exemploSel]
  );

  const marcarCopiado = (chave) => {
    setCopiado(chave);
    window.setTimeout(() => setCopiado((c) => (c === chave ? "" : c)), 2000);
  };

  const gerarTemp = async () => {
    setErro("");
    setOk("");
    setGerando(true);
    try {
      const data = await gestaoApi.criarApiTokenTemp({ validade_minutos: 30 });
      setTokenTemp(data);
      setOk("Token temporário gerado — copie agora (uso único, ~30 min).");
      window.requestAnimationFrame(() => {
        document.getElementById("gestao-api-token-temp")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    } catch (err) {
      setErro(err.message || "Não foi possível gerar token_temp.");
    } finally {
      setGerando(false);
    }
  };

  const revogar = async (id) => {
    if (!window.confirm("Revogar esta API Key? Sistemas que a usam deixarão de autenticar.")) {
      return;
    }
    setErro("");
    try {
      await gestaoApi.revogarApiToken(id);
      setOk("API Key revogada.");
      await carregar();
    } catch (err) {
      setErro(err.message || "Falha ao revogar.");
    }
  };

  const tokensAtivos = tokens.filter((t) => t.ativa).length;
  const passosGuia = guia?.passos || [];

  return (
    <div className="gestao-api-page">
      <GestaoPageHeader
        icon="api"
        title="API de integração"
        subtitle="Tokens para sistemas parceiros e documentação REST com exemplos Python"
      >
        <button
          type="button"
          className="btn btn-primary gestao-btn-cta"
          onClick={gerarTemp}
          disabled={gerando}
        >
          <GestaoIcon name="mais" />
          {gerando ? "Gerando..." : "Gerar token_temp"}
        </button>
      </GestaoPageHeader>

      {erro && <div className="alert alert-error">{erro}</div>}
      {ok && !tokenTemp?.token_temp && <div className="alert alert-success">{ok}</div>}

      <div className="gestao-api-layout">
        <section className="gestao-api-card gestao-api-card--fluxo">
          <div className="gestao-api-card-head">
            <h2>Emissão de token</h2>
            <p>token_perm só com conta gestor/admin. Alunos autenticam no front do parceiro.</p>
          </div>
          <ol className="gestao-api-steps">
            {PASSOS_TOKEN.map((p, i) => (
              <li key={p.titulo} className="gestao-api-step">
                <span className="gestao-api-step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{p.titulo}</strong>
                  <p>{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="gestao-api-card gestao-api-card--env">
          <div className="gestao-api-card-head">
            <h2>Variáveis .env</h2>
            <p>No sistema parceiro que consome a API.</p>
          </div>
          <div className="gestao-api-env">
            <pre>{envSnippet}</pre>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={async () => {
                const okCopy = await copiarTexto(envSnippet);
                if (okCopy) {
                  marcarCopiado("env");
                  setOk("Snippet .env copiado.");
                } else {
                  setErro("Não foi possível copiar.");
                }
              }}
            >
              {copiado === "env" ? "Copiado!" : "Copiar snippet"}
            </button>
          </div>
          <dl className="gestao-api-kpis">
            <div>
              <dt>Keys ativas</dt>
              <dd>{loading ? "…" : tokensAtivos}</dd>
            </div>
            <div>
              <dt>Total emitidas</dt>
              <dd>{loading ? "…" : tokens.length}</dd>
            </div>
          </dl>
        </section>
      </div>

      {tokenTemp?.token_temp && (
        <section id="gestao-api-token-temp" className="gestao-api-reveal gestao-animate-in">
          <div className="gestao-api-reveal-head">
            <div>
              <span className="gestao-api-reveal-badge">Novo · uso único</span>
              <h2>token_temp gerado</h2>
              <p>Copie agora. Após a troca, ele deixa de valer.</p>
            </div>
            <span className="gestao-api-reveal-meta">
              Válido até {formatData(tokenTemp.valido_ate)}
            </span>
          </div>
          <code className="gestao-api-reveal-token">{tokenTemp.token_temp}</code>
          <div className="gestao-api-reveal-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                const okCopy = await copiarTexto(tokenTemp.token_temp);
                if (okCopy) {
                  marcarCopiado("temp");
                  setOk("token_temp copiado.");
                } else {
                  setErro("Não foi possível copiar.");
                }
              }}
            >
              {copiado === "temp" ? "Copiado!" : "Copiar token_temp"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTokenTemp(null)}
            >
              Dispensar
            </button>
          </div>
        </section>
      )}

      <section className="gestao-dashboard-section gestao-api-section">
        <div className="gestao-api-section-head">
          <h2 className="gestao-dashboard-section-title">API Keys permanentes</h2>
          {!loading && tokens.length > 0 && (
            <span className="gestao-api-count">{tokensAtivos} ativa(s)</span>
          )}
        </div>
        <GestaoDataTable
          loading={loading}
          empty={!loading && tokens.length === 0}
          emptyTitle="Nenhuma API Key ainda"
          emptyMessage="Gere um token_temp e troque-o com usuário gestor. A key aparece aqui (sem o secret)."
          emptyAction={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={gerarTemp}
              disabled={gerando}
            >
              <GestaoIcon name="mais" />
              {gerando ? "Gerando..." : "Começar: gerar token_temp"}
            </button>
          }
          skeletonCols={7}
        >
          <thead>
            <tr>
              <th>Nome</th>
              <th>Prefixo</th>
              <th>Usuário</th>
              <th>Válida até</th>
              <th>Último uso</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, index) => (
              <GestaoTableRow key={t.id} index={index}>
                <td>{t.nome || "—"}</td>
                <td>
                  <code className="gestao-api-prefix">{t.prefix}…</code>
                </td>
                <td>{t.username}</td>
                <td>{formatData(t.valido_ate)}</td>
                <td>{formatData(t.ultimo_uso)}</td>
                <td>
                  <StatusBadge
                    status={t.ativa ? "ativo" : "inativo"}
                    label={t.ativa ? "Ativa" : t.revogado_em ? "Revogada" : "Expirada"}
                  />
                </td>
                <td>
                  {t.ativa ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => revogar(t.id)}
                    >
                      Revogar
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </GestaoTableRow>
            ))}
          </tbody>
        </GestaoDataTable>
      </section>

      <section className="gestao-dashboard-section gestao-api-section">
        <div className="gestao-api-section-head">
          <h2 className="gestao-dashboard-section-title">Como usar — passo a passo</h2>
        </div>
        {guia?.resumo && <p className="gestao-api-guia-resumo">{guia.resumo}</p>}
        <ol className="gestao-api-guia-passos">
          {passosGuia.map((p) => (
            <li key={p.ordem}>
              <strong>{p.titulo}</strong>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>

        <div className="gestao-api-code-panel">
          <div className="gestao-api-code-toolbar">
            <div className="gestao-api-model-switch" role="group" aria-label="Modelo Python">
              <button
                type="button"
                className={modeloPy === "requests" ? "active" : ""}
                onClick={() => setModeloPy("requests")}
              >
                python · requests
              </button>
              <button
                type="button"
                className={modeloPy === "http.client" ? "active" : ""}
                onClick={() => setModeloPy("http.client")}
              >
                python · http.client
              </button>
            </div>
            <div className="gestao-tabs gestao-api-exemplo-tabs" role="tablist">
              {exemplos.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  role="tab"
                  aria-selected={exemploAtivo === ex.id}
                  className={`gestao-tab${exemploAtivo === ex.id ? " active" : ""}`}
                  onClick={() => setExemploAtivo(ex.id)}
                >
                  {ex.titulo}
                </button>
              ))}
            </div>
          </div>
          <pre className="gestao-api-code-block">{codigoPy}</pre>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={!codigoPy}
            onClick={async () => {
              const okCopy = await copiarTexto(codigoPy);
              if (okCopy) marcarCopiado("code");
              else setErro("Não foi possível copiar.");
            }}
          >
            {copiado === "code" ? "Código copiado!" : "Copiar código"}
          </button>
        </div>
      </section>

      <section className="gestao-dashboard-section gestao-api-section">
        <div className="gestao-api-section-head">
          <h2 className="gestao-dashboard-section-title">Documentação REST</h2>
        </div>
        <div className="gestao-tabs gestao-api-tabs" role="tablist" aria-label="Filtrar por grupo">
          {grupos.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={filtroGrupo === g}
              className={`gestao-tab${filtroGrupo === g ? " active" : ""}`}
              onClick={() => setFiltroGrupo(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <GestaoDataTable
          loading={loading}
          empty={!loading && catalogoFiltrado.length === 0}
          emptyTitle="Nenhum endpoint neste grupo"
          skeletonCols={5}
        >
          <thead>
            <tr>
              <th>Método</th>
              <th>Path</th>
              <th>Auth</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {catalogoFiltrado.map((ep, index) => (
              <GestaoTableRow key={`${ep.metodo}-${ep.path}`} index={index}>
                <td>
                  <MetodoBadge metodo={ep.metodo} />
                </td>
                <td>
                  <code className="gestao-api-path">{ep.path}</code>
                </td>
                <td>
                  <span className="gestao-api-auth">{ep.auth}</span>
                </td>
                <td>{ep.descricao}</td>
              </GestaoTableRow>
            ))}
          </tbody>
        </GestaoDataTable>
      </section>
    </div>
  );
}
