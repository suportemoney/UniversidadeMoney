"""Serviços TOTP (Google Authenticator etc.) para MFA do painel."""
import base64
import hashlib
import io
import secrets
from datetime import timedelta

import pyotp
import qrcode
from django.utils import timezone

from apps.accounts.models import DispositivoConfiavelMfa, Profile
from apps.accounts.validators import cpf_valido, normalizar_cpf

CACHE_CPF_MFA_TTL = 900  # 15 min
DIAS_DISPOSITIVO_CONFIAVEL = 30
MAX_DISPOSITIVOS_POR_USER = 5


def marcar_cpf_verificado_mfa(user_id: int):
    """Persiste no Profile (compartilhado entre workers), não no cache em memória."""
    Profile.objects.filter(user_id=user_id).update(
        mfa_cpf_ok_ate=timezone.now() + timedelta(seconds=CACHE_CPF_MFA_TTL)
    )


def cpf_foi_verificado_mfa(user_id: int) -> bool:
    ate = (
        Profile.objects.filter(user_id=user_id)
        .values_list("mfa_cpf_ok_ate", flat=True)
        .first()
    )
    return bool(ate and ate >= timezone.now())


def limpar_cpf_verificado_mfa(user_id: int):
    Profile.objects.filter(user_id=user_id).update(mfa_cpf_ok_ate=None)


def verificar_cpf_do_usuario(user, cpf: str):
    """
    Confere CPF com o Profile.
    Se a conta ainda não tem CPF (ex.: superuser do ensure_superuser),
    vincula o CPF informado na primeira passagem pelo MFA.
    """
    cpf_norm = normalizar_cpf(cpf)
    if not cpf_valido(cpf_norm):
        raise ValueError("CPF inválido.")
    profile, _ = Profile.objects.get_or_create(user=user)
    cpf_atual = (profile.cpf or "").strip()
    if not cpf_atual:
        if Profile.objects.filter(cpf=cpf_norm).exclude(user=user).exists():
            raise ValueError("Este CPF já está cadastrado em outra conta.")
        profile.cpf = cpf_norm
        profile.mfa_cpf_ok_ate = timezone.now() + timedelta(seconds=CACHE_CPF_MFA_TTL)
        profile.save(update_fields=["cpf", "mfa_cpf_ok_ate"])
    elif cpf_atual != cpf_norm:
        raise ValueError("CPF não confere com o cadastrado nesta conta.")
    else:
        profile.mfa_cpf_ok_ate = timezone.now() + timedelta(seconds=CACHE_CPF_MFA_TTL)
        profile.save(update_fields=["mfa_cpf_ok_ate"])
    return True


def garantir_secret_totp(user) -> str:
    """Garante totp_secret no Profile (ainda não confirmado)."""
    profile, _ = Profile.objects.get_or_create(user=user)
    if not profile.totp_secret:
        profile.totp_secret = pyotp.random_base32()
        profile.save(update_fields=["totp_secret"])
    return profile.totp_secret


def otpauth_uri(user) -> str:
    secret = garantir_secret_totp(user)
    return pyotp.TOTP(secret).provisioning_uri(
        name=user.get_username(),
        issuer_name="UniversidadeMoney Painel",
    )


def qr_base64_png(otpauth: str) -> str:
    img = qrcode.make(otpauth)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def verificar_codigo_totp(user, codigo: str) -> bool:
    profile = getattr(user, "profile", None)
    if not profile or not profile.totp_secret:
        return False
    totp = pyotp.TOTP(profile.totp_secret)
    return totp.verify(str(codigo or "").strip(), valid_window=1)


def confirmar_enroll_totp(user, codigo: str):
    if not cpf_foi_verificado_mfa(user.id):
        raise ValueError("Confirme o CPF antes de ativar o autenticador.")
    if not verificar_codigo_totp(user, codigo):
        raise ValueError("Código inválido. Confira o app autenticador.")
    profile = user.profile
    profile.totp_confirmado = True
    profile.mfa_cpf_ok_ate = None
    profile.save(update_fields=["totp_confirmado", "mfa_cpf_ok_ate"])
    return True


def verificar_login_totp(user, codigo: str):
    if not cpf_foi_verificado_mfa(user.id):
        raise ValueError("Confirme o CPF antes de informar o código.")
    profile = getattr(user, "profile", None)
    if not profile or not profile.totp_confirmado:
        raise ValueError("Autenticador ainda não configurado.")
    if not verificar_codigo_totp(user, codigo):
        raise ValueError("Código inválido.")
    limpar_cpf_verificado_mfa(user.id)
    return True


def _hash_token_dispositivo(token: str) -> str:
    return hashlib.sha256((token or "").encode("utf-8")).hexdigest()


def criar_dispositivo_confiavel(user, user_agent: str = "") -> str:
    """Cria registro e devolve o token em texto plano (só nesta resposta)."""
    plaintext = secrets.token_urlsafe(32)
    # Limita quantidade: remove os mais antigos além do limite
    qs = DispositivoConfiavelMfa.objects.filter(usuario=user, ativo=True).order_by("criado_em")
    extras = qs.count() - (MAX_DISPOSITIVOS_POR_USER - 1)
    if extras > 0:
        ids = list(qs.values_list("id", flat=True)[:extras])
        DispositivoConfiavelMfa.objects.filter(id__in=ids).update(ativo=False)

    DispositivoConfiavelMfa.objects.create(
        usuario=user,
        token_hash=_hash_token_dispositivo(plaintext),
        user_agent=(user_agent or "")[:255],
        valido_ate=timezone.now() + timedelta(days=DIAS_DISPOSITIVO_CONFIAVEL),
    )
    return plaintext


def validar_dispositivo_confiavel(user, token: str) -> bool:
    """Valida token de dispositivo confiável e atualiza último uso."""
    if not token or not user:
        return False
    token_hash = _hash_token_dispositivo(token)
    try:
        device = DispositivoConfiavelMfa.objects.get(
            usuario=user,
            token_hash=token_hash,
            ativo=True,
        )
    except DispositivoConfiavelMfa.DoesNotExist:
        return False
    if not device.esta_valido():
        device.ativo = False
        device.save(update_fields=["ativo"])
        return False
    device.ultimo_uso = timezone.now()
    device.save(update_fields=["ultimo_uso"])
    return True
