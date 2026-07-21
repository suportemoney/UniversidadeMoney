import { useState } from "react";
import { gestaoApi } from "../../services/gestaoApi";

export default function VideoUploadField({ aula, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro("");
    setLoading(true);
    try {
      const data = await gestaoApi.uploadVideo(aula.id, file);
      onUploaded(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestao-video-upload">
      {aula.video_url ? (
        <video controls src={aula.video_url} className="gestao-video-preview" />
      ) : (
        <p className="gestao-muted">Nenhum vídeo enviado.</p>
      )}
      <label className="btn btn-outline btn-sm">
        {loading ? "Convertendo para .webm… aguarde (pode levar alguns minutos)" : "Enviar vídeo (salva como .webm)"}
        <input
          type="file"
          accept="video/*,.mp4,.m4v,.webm,.mov,.avi,.mkv,.mpeg,.mpg,.wmv,.flv,.3gp,.ogv,.ts"
          hidden
          onChange={handleFile}
          disabled={loading}
        />
      </label>
      {erro && <p className="gestao-erro">{erro}</p>}
    </div>
  );
}
