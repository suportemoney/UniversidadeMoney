import { useEffect, useState } from "react";
import VideoUploadField from "./VideoUploadField";
import { gestaoApi } from "../../services/gestaoApi";

const TIPO_LABEL = {
  texto: "O que você vai aprender",
  apostila: "Apostilas",
  video: "Videoaulas",
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
    <div className="gestao-modulo">
      <div className="gestao-modulo-actions">
        <h3>{mod.titulo}</h3>
        <span className="gestao-modulo-tipo">{TIPO_LABEL[mod.tipo] || mod.tipo}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onReordenar(idx, -1)}>↑</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onReordenar(idx, 1)}>↓</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onEditarModulo(mod)}>Editar</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onExcluirModulo(mod)}>Excluir</button>
        {mod.tipo === "video" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onAddAula(mod.id)}>+ Aula</button>
        )}
        {mod.tipo === "apostila" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onAddArquivo(mod.id)}>+ Arquivo</button>
        )}
      </div>

      {mod.tipo === "texto" && (
        <div className="gestao-modulo-texto">
          <label>
            Conteúdo — O que você vai aprender
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              placeholder="Descreva os aprendizados deste módulo..."
            />
          </label>
          {msgTexto && <p className={msgTexto === "Texto salvo." ? "gestao-muted" : "modal-alert modal-alert--error"}>{msgTexto}</p>}
          <button type="button" className="btn btn-primary btn-sm" onClick={salvarTexto} disabled={salvandoTexto}>
            {salvandoTexto ? "Salvando..." : "Salvar texto"}
          </button>
        </div>
      )}

      {mod.tipo === "apostila" && (
        <div className="gestao-modulo-arquivos">
          {(mod.arquivos || []).map((arq) => (
            <div key={arq.id} className="gestao-aula">
              <div className="gestao-modulo-actions">
                <strong>{arq.titulo}</strong>
                <span className="gestao-muted">{arq.tipo === "audio" ? "Áudio" : "PDF"}</span>
                {arq.arquivo_url && (
                  <a href={arq.arquivo_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Abrir</a>
                )}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onExcluirArquivo(arq)}>Excluir</button>
              </div>
            </div>
          ))}
          {!mod.arquivos?.length && <p className="gestao-muted">Nenhum arquivo adicionado.</p>}
        </div>
      )}

      {mod.tipo === "video" && mod.aulas?.map((aula) => (
        <div key={aula.id} className="gestao-aula">
          <div className="gestao-modulo-actions">
            <strong>{aula.titulo}</strong>
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
          <VideoUploadField aula={aula} onUploaded={onRecarregar} />
        </div>
      ))}

      {mod.tipo === "video" && !mod.aulas?.length && (
        <p className="gestao-muted">Nenhuma aula em vídeo. Clique em + Aula.</p>
      )}
    </div>
  );
}
