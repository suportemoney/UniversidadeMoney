"""Modelos de perfil e token de acesso de colaborador."""
import secrets
import string

from django.conf import settings
from django.db import models
from django.utils import timezone


def gerar_chave_token_acesso():
    """Gera chave legível no formato UM-ACESSO-XXXX-XXXX."""
    chars = string.ascii_uppercase + string.digits
    b1 = "".join(secrets.choice(chars) for _ in range(4))
    b2 = "".join(secrets.choice(chars) for _ in range(4))
    return f"UM-ACESSO-{b1}-{b2}"


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    # Nullable até o primeiro acesso (ativação via TokenAcesso)
    cpf = models.CharField(
        max_length=11,
        unique=True,
        null=True,
        blank=True,
        verbose_name="CPF",
    )
    cargo = models.CharField(max_length=100, blank=True, default="Colaborador")
    setor = models.ForeignKey(
        "cursos.Setor",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="colaboradores",
        verbose_name="Setor",
    )
    is_membro_equipe = models.BooleanField(
        default=False,
        verbose_name="Membro da equipe",
    )
    precisa_redefinir_senha = models.BooleanField(
        default=False,
        verbose_name="Precisa redefinir senha",
    )

    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfis"

    def __str__(self):
        return f"Perfil de {self.user.get_username()}"


class TokenAcesso(models.Model):
    """Convite de primeiro acesso (colaborador interno), distinto de TokenPlano."""

    chave = models.CharField(
        max_length=40,
        unique=True,
        default=gerar_chave_token_acesso,
        db_index=True,
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tokens_acesso",
    )
    ativo = models.BooleanField(default=True)
    usado_em = models.DateTimeField(null=True, blank=True)
    valido_ate = models.DateTimeField(null=True, blank=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tokens_acesso_criados",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Token de acesso"
        verbose_name_plural = "Tokens de acesso"

    def __str__(self):
        return f"{self.chave} → {self.usuario.get_username()}"

    def esta_valido(self):
        if not self.ativo or self.usado_em is not None:
            return False
        if self.valido_ate and timezone.now() > self.valido_ate:
            return False
        return True
