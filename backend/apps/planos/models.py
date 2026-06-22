"""Modelos de planos, tokens e assinaturas."""
import secrets
import string

from django.conf import settings
from django.db import models


def gerar_chave_token():
    """Gera chave legível no formato UM-XXXX-XXXX-XXXX."""
    chars = string.ascii_uppercase + string.digits
    blocos = ["".join(secrets.choice(chars) for _ in range(4)) for _ in range(3)]
    return f"UM-{'-'.join(blocos)}"


class Plano(models.Model):
    titulo = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    acesso_cursos = models.BooleanField(default=True)
    acesso_trilhas = models.BooleanField(default=False)
    acesso_ao_vivo = models.BooleanField(default=False)

    tags_cursos = models.ManyToManyField(
        "cursos.TagCurso",
        blank=True,
        related_name="planos",
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["titulo"]
        verbose_name = "Plano"
        verbose_name_plural = "Planos"

    def __str__(self):
        return self.titulo

    def features_dict(self):
        """Features restritas do plano (padrão vem de services.FEATURES_PADRAO)."""
        return {
            "acesso_cursos": self.acesso_cursos,
            "acesso_trilhas": self.acesso_trilhas,
            "acesso_ao_vivo": self.acesso_ao_vivo,
        }


class TokenPlano(models.Model):
    TIPO_DATA_FIXA = "data_fixa"
    TIPO_DURACAO = "duracao"
    TIPO_EXPIRACAO_CHOICES = [
        (TIPO_DATA_FIXA, "Data fixa"),
        (TIPO_DURACAO, "Duração a partir do resgate"),
    ]

    chave = models.CharField(max_length=32, unique=True, default=gerar_chave_token)
    plano = models.ForeignKey(Plano, on_delete=models.CASCADE, related_name="tokens")
    max_usos = models.PositiveIntegerField(default=1)
    usos_realizados = models.PositiveIntegerField(default=0)
    tipo_expiracao = models.CharField(
        max_length=20, choices=TIPO_EXPIRACAO_CHOICES, default=TIPO_DURACAO
    )
    data_fim = models.DateTimeField(null=True, blank=True)
    duracao_dias = models.PositiveIntegerField(null=True, blank=True)
    valido_ate_resgate = models.DateTimeField(null=True, blank=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tokens_criados",
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Token de plano"
        verbose_name_plural = "Tokens de plano"

    def __str__(self):
        return f"{self.chave} ({self.plano.titulo})"


class AssinaturaUsuario(models.Model):
    STATUS_ATIVA = "ativa"
    STATUS_EXPIRADA = "expirada"
    STATUS_CANCELADA = "cancelada"
    STATUS_CHOICES = [
        (STATUS_ATIVA, "Ativa"),
        (STATUS_EXPIRADA, "Expirada"),
        (STATUS_CANCELADA, "Cancelada"),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assinaturas",
    )
    plano = models.ForeignKey(Plano, on_delete=models.PROTECT, related_name="assinaturas")
    token = models.ForeignKey(
        TokenPlano,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resgates",
    )
    ativado_em = models.DateTimeField(auto_now_add=True)
    expira_em = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ATIVA)

    class Meta:
        ordering = ["-ativado_em"]
        verbose_name = "Assinatura do usuário"
        verbose_name_plural = "Assinaturas dos usuários"

    def __str__(self):
        return f"{self.usuario.email} — {self.plano.titulo}"
