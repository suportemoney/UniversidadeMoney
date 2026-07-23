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
    NIVEL_PADRAO = "padrao"
    NIVEL_INSTRUTOR = "instrutor"
    NIVEL_GESTOR = "gestor"
    NIVEL_ADMINISTRADOR = "administrador"
    NIVEL_CHOICES = [
        (NIVEL_PADRAO, "Padrão"),
        (NIVEL_INSTRUTOR, "Instrutor"),
        (NIVEL_GESTOR, "Gestor"),
        (NIVEL_ADMINISTRADOR, "Administrador"),
    ]
    nivel_acesso = models.CharField(
        max_length=20,
        choices=NIVEL_CHOICES,
        default=NIVEL_PADRAO,
        verbose_name="Nível de acesso",
    )
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
    totp_secret = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Segredo TOTP",
    )
    totp_confirmado = models.BooleanField(
        default=False,
        verbose_name="TOTP confirmado",
    )
    # Validade da confirmação de CPF no fluxo MFA (evita cache local por worker)
    mfa_cpf_ok_ate = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="CPF verificado no MFA até",
    )

    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfis"

    def __str__(self):
        return f"Perfil de {self.user.get_username()}"


class DispositivoConfiavelMfa(models.Model):
    """Dispositivo em que o usuário optou por não repetir o TOTP no painel."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dispositivos_mfa",
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    valido_ate = models.DateTimeField()
    ultimo_uso = models.DateTimeField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Dispositivo confiável MFA"
        verbose_name_plural = "Dispositivos confiáveis MFA"

    def esta_valido(self):
        if not self.ativo:
            return False
        if timezone.now() > self.valido_ate:
            return False
        return True


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


class TokenTempApi(models.Model):
    """Token temporário de uso único para trocar por ApiKey permanente."""

    prefix = models.CharField(max_length=16, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tokens_temp_api_criados",
    )
    valido_ate = models.DateTimeField()
    usado_em = models.DateTimeField(null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Token API temporário"
        verbose_name_plural = "Tokens API temporários"

    def esta_valido(self):
        if not self.ativo or self.usado_em is not None:
            return False
        if timezone.now() > self.valido_ate:
            return False
        return True


class ApiKeyPerm(models.Model):
    """API Key permanente (hash SHA-256); plaintext só na criação/troca."""

    nome = models.CharField(max_length=120, blank=True, default="")
    prefix = models.CharField(max_length=16, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="api_keys_perm",
    )
    valido_ate = models.DateTimeField(null=True, blank=True)
    revogado_em = models.DateTimeField(null=True, blank=True)
    ultimo_uso = models.DateTimeField(null=True, blank=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="api_keys_criadas",
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "API Key permanente"
        verbose_name_plural = "API Keys permanentes"

    def esta_valida(self):
        if self.revogado_em is not None:
            return False
        if self.valido_ate and timezone.now() > self.valido_ate:
            return False
        if not self.usuario_id or not self.usuario.is_active:
            return False
        return True
