"""Modelos da landing page pública."""
import uuid

from django.db import models


def banner_gif_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "gif"
    return f"landing/banners/{uuid.uuid4().hex}.{ext}"


class FaixaPromocional(models.Model):
    """Faixa no topo da landing — apenas uma ativa por vez."""

    mensagem = models.CharField(max_length=300)
    texto_botao = models.CharField(max_length=80, blank=True)
    url_botao = models.CharField(max_length=500, blank=True)
    exibir_countdown = models.BooleanField(default=False)
    data_fim_countdown = models.DateTimeField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Faixa promocional"
        verbose_name_plural = "Faixas promocionais"

    def __str__(self):
        return self.mensagem[:50]


class BannerLanding(models.Model):
    """Banner GIF do carrossel hero."""

    titulo = models.CharField(max_length=200, blank=True)
    subtitulo = models.CharField(max_length=300, blank=True)
    link = models.CharField(max_length=500, blank=True)
    imagem = models.FileField(upload_to=banner_gif_upload_path, blank=True)
    ordem = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ordem", "id"]
        verbose_name = "Banner da landing"
        verbose_name_plural = "Banners da landing"

    def __str__(self):
        return self.titulo or f"Banner #{self.pk}"

    @property
    def imagem_url(self):
        if self.imagem:
            return self.imagem.url
        return None
