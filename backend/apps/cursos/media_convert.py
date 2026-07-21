"""Conversão de mídia: vídeos → .webm, imagens → .webp."""
import os
import subprocess
import tempfile

from django.core.files.base import ContentFile
from PIL import Image


class MediaConvertError(Exception):
    """Falha ao converter arquivo de mídia."""


def converter_video_para_webm(uploaded_file):
    """
    Converte upload de vídeo (mp4, avi, mov, etc.) para VP9/Opus .webm.
    Prioriza arquivo menor e conversão mais rápida (máx. 720p, cpu-used alto).
    Retorna ContentFile pronto para FileField.save().
    """
    suffix = os.path.splitext(getattr(uploaded_file, "name", "") or "")[1] or ".mp4"
    with tempfile.TemporaryDirectory() as tmp:
        entrada = os.path.join(tmp, f"in{suffix}")
        saida = os.path.join(tmp, "out.webm")
        with open(entrada, "wb") as f:
            try:
                uploaded_file.seek(0)
            except Exception:
                pass
            if hasattr(uploaded_file, "chunks"):
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            else:
                f.write(uploaded_file.read())

        # VP9 compacto + rápido: limita altura a 720p, CRF alto, cpu-used 8
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            entrada,
            "-vf",
            "scale=-2:'min(720,ih)'",
            "-c:v",
            "libvpx-vp9",
            "-crf",
            "36",
            "-b:v",
            "0",
            "-row-mt",
            "1",
            "-cpu-used",
            "8",
            "-deadline",
            "realtime",
            "-threads",
            "2",
            "-c:a",
            "libopus",
            "-b:a",
            "64k",
            "-ac",
            "2",
            saida,
        ]
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1200,
                check=False,
            )
        except FileNotFoundError as exc:
            raise MediaConvertError("ffmpeg não está instalado no servidor.") from exc
        except subprocess.TimeoutExpired as exc:
            raise MediaConvertError(
                "Conversão de vídeo excedeu o tempo limite (20 min). "
                "Tente um arquivo menor ou mais curto."
            ) from exc

        if result.returncode != 0 or not os.path.exists(saida):
            detalhe = (result.stderr or result.stdout or "").strip()[-500:]
            raise MediaConvertError(f"Falha ao converter vídeo para webm. {detalhe}")

        tamanho = os.path.getsize(saida)
        if tamanho < 100:
            raise MediaConvertError("Arquivo webm gerado está vazio ou inválido.")

        with open(saida, "rb") as f:
            dados = f.read()
        return ContentFile(dados, name="video.webm")


def converter_imagem_para_webp(uploaded_file, quality=80):
    """Converte upload de imagem para .webp via Pillow."""
    try:
        uploaded_file.seek(0)
    except Exception:
        pass
    try:
        img = Image.open(uploaded_file)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        with tempfile.NamedTemporaryFile(suffix=".webp", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            img.save(tmp_path, format="WEBP", quality=quality, method=6)
            with open(tmp_path, "rb") as f:
                dados = f.read()
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        return ContentFile(dados, name="thumb.webp")
    except Exception as exc:
        raise MediaConvertError(f"Falha ao converter imagem para webp: {exc}") from exc
