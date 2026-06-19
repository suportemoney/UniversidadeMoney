import { useState } from "react";
import { gestaoApi } from "../../services/gestaoApi";

export default function ThumbnailUploadField({ cursoId, thumbnailUrl, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro("");
    setLoading(true);
    try {
      const data = await gestaoApi.uploadThumbnail(cursoId, file);
      onUploaded(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestao-thumbnail">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="Capa do curso" className="gestao-thumbnail-preview" />
      ) : (
        <div className="gestao-thumbnail-placeholder">Sem capa</div>
      )}
      <label className="btn btn-outline btn-sm">
        {loading ? "Enviando..." : "Enviar capa (jpg/png)"}
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} disabled={loading} />
      </label>
      {erro && <p className="gestao-erro">{erro}</p>}
    </div>
  );
}
