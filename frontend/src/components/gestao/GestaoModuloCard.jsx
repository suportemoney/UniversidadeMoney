import { useEffect, useState } from "react";
import GestaoIcon from "./GestaoIcons";
import VideoUploadField from "./VideoUploadField";
import { gestaoApi } from "../../services/gestaoApi";

const TIPO_LABEL = {
  texto: "O que você vai aprender",
  apostila: "Apostilas",
  video: "Videoaulas",
};

const TIPO_ICONE = {
  texto: "texto",
  apostila: "apostila",
  video: "videoAula",
};

export default function GestaoModuloCard({
  mod,
  idx,
  onReordenar,
  onEditarModulo,
  onExcluirModulo,
  onAddAula,
  onEditAula,
  onExcluirAula,
  onAddArquivo,
  onExcluirArquivo,
  onRecarregar,
}) {
  const [texto, setTexto] = useState(mod.conteudo_texto || "");
  const [salvandoTexto, setSalvandoTexto] = useState(false);
  const [msgTexto, setMsgTexto] = useState("");

  useEffect(() => {
    setTexto(mod.conteudo_texto || "");
  }, [mod.id, mod.conteudo_texto]);

  const salvarTexto = async () => {
    setSalvandoTexto(true);
    setMsgTexto("");
    try {
      await gestaoApi.atualizarModulo(mod.id, { conteudo_texto: texto });
      setMsgTexto("Texto salvo.");
      onRecarregar();
    } catch (err) {
      setMsgTexto(err.message);
    } finally {
      setSalvandoTexto(false);
    }
  };

  return (
    <article className={`gestao-modulo gestao-modulo--${mod.tipo}`}>
      <header className="gestao-modulo-header">
        <span className="gestao-modulo-ordem" aria-hidden>{idx + 1}</span>
        <div className="gestao-modulo-header-main">
          <div className="gestao-modulo-header-title">
            <GestaoIcon name={TIPO_ICONE[mod.tipo] || "cursos"} className="gestao-modulo-header-icon" />
            <h3>{mod.titulo}</h3>
          </div>
          <span className={`gestao-modulo-tipo gestao-modulo-tipo--${mod.tipo}`}>
            {TIPO_LABEL[mod.tipo] || mod.tipo}
          </span>
        </div>
        <div className="gestao-modulo-toolbar">
          <button type="button" className="gestao-modulo-btn" title="Subir" onClick={() => onReordenar(idx, -1)}>
            <GestaoIcon name="subir" />
          </button>
          <button type="button" className="gestao-modulo-btn" title="Descer" onClick={() => onReordenar(idx, 1)}>
            <GestaoIcon name="descer" />
          </button>
          <button type="button" className="gestao-modulo-btn" title="Editar módulo" onClick={() => onEditarModulo(mod)}>
            <GestaoIcon name="editar" />
          </button>
          <button type="button" className="gestao-modulo-btn gestao-modulo-btn--danger" title="Excluir módulo" onClick={() => onExcluirModulo(mod)}>
            <GestaoIcon name="excluir" />
          </button>
          {mod.tipo === "video" && (
            <button type="button" className="btn btn-primary btn-sm gestao-modulo-btn-cta" onClick={() => onAddAula(mod.id)}>
              <GestaoIcon name="mais" /> Aula
            </button>
          )}
          {mod.tipo === "apostila" && (
            <button type="button" className="btn btn-primary btn-sm gestao-modulo-btn-cta" onClick={() => onAddArquivo(mod.id)}>
              <GestaoIcon name="mais" /> Arquivo
            </button>
          )}
        </div>
      </header>

      <div className="gestao-modulo-body">
        {mod.tipo === "texto" && (
          <div className="gestao-modulo-texto">
            <label className="gestao-field gestao-field--stacked">
              <span className="gestao-field-label">Conteúdo do módulo</span>
              <span className="gestao-field-hint">Liste o que o aluno vai aprender nesta etapa do curso.</span>
              <textarea
                className="gestao-modulo-textarea"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={10}
                placeholder={"Ex.:\n• Entender juros compostos\n• Calcular multiplicação patrimonial\n• Aplicar na prática com exemplos reais"}
              />
            </label>
            <div className="gestao-modulo-texto-footer">
              {msgTexto && (
                <p className={msgTexto === "Texto salvo." ? "gestao-modulo-msg gestao-modulo-msg--ok" : "gestao-modulo-msg gestao-modulo-msg--erro"}>
                  {msgTexto}
                </p>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={salvarTexto} disabled={salvandoTexto}>
                {salvandoTexto ? "Salvando..." : "Salvar texto"}
              </button>
            </div>
          </div>
        )}

        {mod.tipo === "apostila" && (
          <div className="gestao-modulo-arquivos">
            {(mod.arquivos || []).map((arq) => (
              <div key={arq.id} className="gestao-modulo-item">
                <div className="gestao-modulo-item-icon" aria-hidden>
                  {arq.tipo === "audio" ? "🎧" : "📄"}
                </div>
                <div className="gestao-modulo-item-main">
                  <strong>{arq.titulo}</strong>
                  <span>{arq.tipo === "audio" ? "Arquivo de áudio" : "Documento PDF"}</span>
                </div>
                <div className="gestao-modulo-item-actions">
                  {arq.arquivo_url && (
                    <a href={arq.arquivo_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Abrir</a>
                  )}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onExcluirArquivo(arq)}>Excluir</button>
                </div>
              </div>
            ))}
            {!mod.arquivos?.length && (
              <div className="gestao-modulo-empty">
                <span className="gestao-modulo-empty-icon" aria-hidden>📎</span>
                <p>Nenhum arquivo adicionado.</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onAddArquivo(mod.id)}>Adicionar apostila</button>
              </div>
            )}
          </div>
        )}

        {mod.tipo === "video" && (
          <>
            {mod.aulas?.map((aula) => (
              <div key={aula.id} className="gestao-modulo-item gestao-modulo-item--aula">
                <div className="gestao-modulo-item-icon gestao-modulo-item-icon--video" aria-hidden>▶</div>
                <div className="gestao-modulo-item-main">
                  <strong>{aula.titulo}</strong>
                  <span>{aula.video_url ? "Vídeo anexado" : "Aguardando upload do vídeo"}</span>
                </div>
                <div className="gestao-modulo-item-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onEditAula(aula, mod.id)}>Editar</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onExcluirAula(aula)}>Excluir</button>
                  {aula.video_url && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => gestaoApi.removerVideo(aula.id).then(onRecarregar)}
                    >
                      Remover vídeo
                    </button>
                  )}
                </div>
                <div className="gestao-modulo-item-upload">
                  <VideoUploadField aula={aula} onUploaded={onRecarregar} />
                </div>
              </div>
            ))}
            {!mod.aulas?.length && (
              <div className="gestao-modulo-empty">
                <span className="gestao-modulo-empty-icon" aria-hidden>🎬</span>
                <p>Nenhuma aula em vídeo.</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onAddAula(mod.id)}>Criar primeira aula</button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
