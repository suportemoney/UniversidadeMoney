import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";

const VOLUME_MINIMO = 0.2; // 20% — abaixo disso o vídeo pausa

function formatTempo(segundos) {
  if (!Number.isFinite(segundos) || segundos < 0) return "00:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Player sem controles nativos: sem seek/velocidade enquanto não concluída.
 * Volume mínimo 20%. Tela cheia. Pausa ao perder foco da página.
 */
export default function VideoPlayerControlado({
  aulaId,
  src,
  concluidaInicial = false,
  percentualInicial = 0,
  onProgresso,
}) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const lastHbRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [concluida, setConcluida] = useState(!!concluidaInicial);
  const [percentual, setPercentual] = useState(percentualInicial || 0);
  const [erro, setErro] = useState("");
  const [volume, setVolume] = useState(0.8);
  const [volumeBaixo, setVolumeBaixo] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const podeSeek = concluida;
  const volumePct = Math.round(volume * 100);

  const enviarProgresso = async (posicao, dur) => {
    if (!aulaId || !src) return;
    try {
      const r = await apiFetch(`/aulas/${aulaId}/progresso/`, {
        method: "POST",
        body: JSON.stringify({
          posicao_atual: posicao,
          duracao: dur > 0 ? dur : undefined,
        }),
      });
      setPercentual(r.percentual_assistido ?? percentual);
      if (r.concluida) setConcluida(true);
      onProgresso?.(r);
      return r;
    } catch (e) {
      setErro(e.message || "Falha ao salvar progresso");
      return null;
    }
  };

  const aplicarVolume = (valor) => {
    const v = videoRef.current;
    const nivel = Math.max(0, Math.min(1, valor));
    setVolume(nivel);
    if (v) {
      v.volume = nivel;
      v.muted = nivel <= 0;
    }
    if (nivel < VOLUME_MINIMO) {
      setVolumeBaixo(true);
      if (v && !v.paused) {
        v.pause();
        setPlaying(false);
      }
    } else {
      setVolumeBaixo(false);
    }
  };

  useEffect(() => {
    setConcluida(!!concluidaInicial);
    setPercentual(percentualInicial || 0);
    setCurrent(0);
    setPlaying(false);
    setVolumeBaixo(false);
    lastHbRef.current = 0;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
      v.playbackRate = 1;
      v.volume = volume;
      v.muted = volume <= 0;
    }
    // volume intencional: mantém o nível escolhido entre aulas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, src, concluidaInicial, percentualInicial]);

  // Pausa ao sair da aba / perder foco da janela
  useEffect(() => {
    const pausar = () => {
      const v = videoRef.current;
      if (v && !v.paused) {
        v.pause();
        setPlaying(false);
      }
    };
    const onVis = () => {
      if (document.hidden) pausar();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", pausar);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", pausar);
    };
  }, []);

  // Sincroniza estado de tela cheia
  useEffect(() => {
    const onFs = () => {
      const el = rootRef.current;
      setFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Bloqueia atalhos de seek / velocidade
  useEffect(() => {
    const onKey = (e) => {
      const v = videoRef.current;
      if (!v) return;
      const tags = ["INPUT", "TEXTAREA", "SELECT"];
      if (tags.includes(e.target?.tagName)) return;
      if (podeSeek) return;
      const bloqueados = ["ArrowLeft", "ArrowRight", "j", "J", "l", "L", "<", ">"];
      if (bloqueados.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [podeSeek]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (volume < VOLUME_MINIMO) {
      setVolumeBaixo(true);
      return;
    }
    if (v.paused) {
      v.playbackRate = 1;
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setErro("Não foi possível alternar a tela cheia.");
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime || 0;
    const d = v.duration || duration || 0;
    setCurrent(t);
    if (d > 0) setDuration(d);

    if (!podeSeek && t > lastHbRef.current + 5.5) {
      v.currentTime = lastHbRef.current;
      return;
    }

    const agora = Date.now();
    if (agora - (onTimeUpdate._lastSend || 0) < 2000) return;
    onTimeUpdate._lastSend = agora;
    lastHbRef.current = Math.max(lastHbRef.current, t);
    enviarProgresso(t, d);
  };

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    setDuration(d);
    v.playbackRate = 1;
    v.volume = volume;
    v.muted = volume <= 0;
  };

  const onEnded = () => {
    const v = videoRef.current;
    setPlaying(false);
    const d = v?.duration || duration || 0;
    const t = d > 0 ? d : current;
    lastHbRef.current = t;
    enviarProgresso(t, d);
  };

  const onSeeking = () => {
    const v = videoRef.current;
    if (!v || podeSeek) return;
    if (v.currentTime > lastHbRef.current + 0.5) {
      v.currentTime = lastHbRef.current;
    }
  };

  const onRateChange = () => {
    const v = videoRef.current;
    if (v && v.playbackRate !== 1) v.playbackRate = 1;
  };

  const onVolumeChange = () => {
    const v = videoRef.current;
    if (!v) return;
    const nivel = v.muted ? 0 : v.volume;
    if (Math.abs(nivel - volume) > 0.01) {
      aplicarVolume(nivel);
    }
  };

  const seekTo = (ratio) => {
    if (!podeSeek) return;
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = Math.max(0, Math.min(duration, ratio * duration));
  };

  const barraPct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const assistidoPct = Math.max(barraPct, percentual);

  return (
    <div
      ref={rootRef}
      className={`dash-vplayer${fullscreen ? " is-fullscreen" : ""}`}
    >
      <div className="dash-vplayer-stage">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            className="dash-vplayer-video"
            playsInline
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            onSeeking={onSeeking}
            onRateChange={onRateChange}
            onVolumeChange={onVolumeChange}
            onPlay={() => {
              if (volume < VOLUME_MINIMO) {
                videoRef.current?.pause();
                setVolumeBaixo(true);
                setPlaying(false);
                return;
              }
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <p className="dash-player-empty-msg">Vídeo indisponível — aguarde o upload.</p>
        )}

        {volumeBaixo && src && (
          <div className="dash-vplayer-volume-alert" role="alert">
            <strong>Volume muito baixo</strong>
            <p>Aumente o volume para pelo menos 20% para continuar assistindo.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => aplicarVolume(0.5)}
            >
              Aumentar para 50%
            </button>
          </div>
        )}
      </div>

      <div className="dash-vplayer-controls">
        <button
          type="button"
          className="dash-vplayer-play"
          onClick={togglePlay}
          disabled={!src}
          aria-label={playing ? "Pausar" : "Reproduzir"}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div className="dash-vplayer-times">
          <span>{formatTempo(current)}</span>
          <span>/</span>
          <span>{formatTempo(duration)}</span>
        </div>

        <div
          className={`dash-vplayer-bar${podeSeek ? " is-seekable" : ""}`}
          role="progressbar"
          aria-valuenow={Math.round(assistidoPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={(e) => {
            if (!podeSeek) return;
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="dash-vplayer-bar-fill" style={{ width: `${assistidoPct}%` }} />
        </div>

        <div className="dash-vplayer-volume">
          <button
            type="button"
            className="dash-vplayer-icon-btn"
            onClick={() => aplicarVolume(volume < VOLUME_MINIMO ? 0.5 : 0)}
            aria-label={volume <= 0 ? "Ativar som" : "Silenciar"}
            title={volume <= 0 ? "Ativar som" : "Silenciar"}
          >
            {volume <= 0 ? "🔇" : volume < VOLUME_MINIMO ? "🔈" : "🔊"}
          </button>
          <input
            type="range"
            className="dash-vplayer-volume-slider"
            min={0}
            max={100}
            step={1}
            value={volumePct}
            onChange={(e) => aplicarVolume(Number(e.target.value) / 100)}
            aria-label="Volume"
            title={`Volume ${volumePct}%`}
          />
          <span className="dash-vplayer-volume-pct">{volumePct}%</span>
        </div>

        <button
          type="button"
          className="dash-vplayer-icon-btn"
          onClick={toggleFullscreen}
          disabled={!src}
          aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {fullscreen ? "✕" : "⛶"}
        </button>

        <span className="dash-vplayer-badge">
          {concluida ? "Concluída" : `${Math.round(percentual)}%`}
        </span>
      </div>

      {!podeSeek && (
        <p className="dash-vplayer-hint">
          Assista até o final — não é possível pular ou acelerar o vídeo.
        </p>
      )}
      {erro && <p className="dash-vplayer-erro">{erro}</p>}
    </div>
  );
}
