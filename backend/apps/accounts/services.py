"""Serviços de TokenAcesso (somente ORM — sem SQL raw)."""
import hashlib
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from apps.core.mail import MENSAGEM_GENERICA_RECUPERACAO, enviar_email, url_site

from .models import Profile, TokenAcesso
from .validators import cpf_valido, normalizar_cpf

# Apenas A-Z, 0-9 e hífen; tamanho limitado
CHAVE_PATTERN = re.compile(r"^[A-Z0-9\-]{8,40}$")
SENHA_PADRAO_INICIAL = "123456"


def normalizar_chave_token(chave: str) -> str:
    """Sanitiza a chave informada pelo usuário."""
    if not chave or not isinstance(chave, str):
        return ""
    return chave.strip().upper()


def chave_formato_valido(chave: str) -> bool:
    return bool(chave and CHAVE_PATTERN.match(chave))


def buscar_token_valido(chave: str):
    """
    Busca TokenAcesso ativo e não usado via ORM.
    Retorna None se inválido (mensagem genérica na API).
    """
    chave = normalizar_chave_token(chave)
    if not chave_formato_valido(chave):
        return None
    try:
        token = TokenAcesso.objects.select_related("usuario", "usuario__profile").get(
            chave=chave
        )
    except TokenAcesso.DoesNotExist:
        return None
    if not token.esta_valido():
        return None
    return token


@transaction.atomic
def ativar_token_acesso(chave: str, nova_senha: str, cpf: str):
    """
    Ativa o acesso: confere CPF do Profile, redefine senha e consome o token.
    Levanta ValueError com mensagem amigável em caso de erro.
    """
    token = buscar_token_valido(chave)
    if not token:
        raise ValueError("Token inválido ou expirado.")

    cpf_norm = normalizar_cpf(cpf)
    if not cpf_valido(cpf_norm):
        raise ValueError("CPF inválido.")

    if not nova_senha or len(nova_senha) < 6:
        raise ValueError("A nova senha deve ter pelo menos 6 caracteres.")

    user = token.usuario
    profile, _ = Profile.objects.get_or_create(user=user)
    if not profile.cpf:
        raise ValueError("Conta sem CPF cadastrado. Solicite um novo convite.")
    if profile.cpf != cpf_norm:
        raise ValueError("CPF não confere com o cadastrado no convite.")

    user.set_password(nova_senha)
    user.save(update_fields=["password"])

    profile.precisa_redefinir_senha = False
    profile.save(update_fields=["precisa_redefinir_senha"])

    token.usado_em = timezone.now()
    token.ativo = False
    token.save(update_fields=["usado_em", "ativo"])

    return user


@transaction.atomic
def redefinir_senha_obrigatoria(user, cpf: str, nova_senha: str):
    """Troca senha forçada: confere CPF e limpa precisa_redefinir_senha."""
    cpf_norm = normalizar_cpf(cpf)
    if not cpf_valido(cpf_norm):
        raise ValueError("CPF inválido.")
    if not nova_senha or len(nova_senha) < 6:
        raise ValueError("A nova senha deve ter pelo menos 6 caracteres.")

    profile, _ = Profile.objects.get_or_create(user=user)
    if not profile.cpf or profile.cpf != cpf_norm:
        raise ValueError("CPF não confere com o cadastrado.")

    user.set_password(nova_senha)
    user.save(update_fields=["password"])
    profile.precisa_redefinir_senha = False
    profile.save(update_fields=["precisa_redefinir_senha"])
    return user


@transaction.atomic
def resetar_senha_padrao(user):
    """Admin/gestor: volta senha para 123456 e exige redefinição no próximo login."""
    user.set_password(SENHA_PADRAO_INICIAL)
    user.save(update_fields=["password"])
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.precisa_redefinir_senha = True
    profile.save(update_fields=["precisa_redefinir_senha"])
    return user


def autenticar_por_cpf(cpf: str, password: str):
    """Resolve Profile por CPF e autentica a senha. Retorna User ou None."""
    cpf_norm = normalizar_cpf(cpf or "")
    if len(cpf_norm) != 11:
        return None
    try:
        profile = Profile.objects.select_related("user").get(cpf=cpf_norm)
    except Profile.DoesNotExist:
        return None
    user = profile.user
    if not user.is_active:
        return None
    if not user.check_password(password):
        return None
    return user


def criar_colaborador_com_token(
    *,
    username: str,
    first_name: str = "",
    email: str = "",
    cpf: str = "",
    cargo: str = "Colaborador",
    nivel_acesso: str = "padrao",
    criado_por=None,
    valido_ate=None,
):
    """
    Cria usuário com senha padrão 123456, CPF obrigatório,
    aplica nivel_acesso e um TokenAcesso ativo.
    """
    from apps.cursos.permissions import aplicar_nivel_acesso

    username = (username or "").strip().lower()
    if not username:
        raise ValueError("Informe o username.")
    if User.objects.filter(username=username).exists():
        raise ValueError("Este username já existe.")

    cpf_norm = normalizar_cpf(cpf)
    if not cpf_valido(cpf_norm):
        raise ValueError("CPF inválido.")
    if Profile.objects.filter(cpf=cpf_norm).exists():
        raise ValueError("Este CPF já está cadastrado.")

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=(email or "").strip().lower(),
            password=SENHA_PADRAO_INICIAL,
            first_name=(first_name or "").strip(),
        )
        Profile.objects.create(
            user=user,
            cpf=cpf_norm,
            cargo=cargo or "Colaborador",
            precisa_redefinir_senha=True,
            is_membro_equipe=False,
            nivel_acesso="padrao",
        )
        aplicar_nivel_acesso(user, nivel_acesso or "padrao")
        token = TokenAcesso.objects.create(
            usuario=user,
            criado_por=criado_por,
            valido_ate=valido_ate,
        )
    _enviar_email_convite(user, token)
    return user, token


TTL_CODIGO_SENHA_MINUTOS = 15


def _hash_codigo_senha(codigo: str) -> str:
    bruto = f"{settings.SECRET_KEY}:{codigo}"
    return hashlib.sha256(bruto.encode("utf-8")).hexdigest()


def _enviar_email_convite(user, token):
    email = (user.email or "").strip()
    if not email:
        return
    url_interno = url_site("/interno/")
    nome = user.first_name or user.get_username()
    enviar_email(
        "Seu acesso à Universidade Money",
        (
            f"Olá, {nome}.\n\n"
            f"Você foi convidado(a) para a Universidade Money.\n"
            f"Token-key: {token.chave}\n"
            f"Ative em: {url_interno}\n\n"
            f"No primeiro acesso, confirme seu CPF e defina uma senha.\n"
        ),
        [email],
    )


def localizar_usuario_recuperacao(identificador: str):
    """Encontra usuário ativo por e-mail, CPF ou username."""
    ident = (identificador or "").strip()
    if not ident:
        return None
    if "@" in ident:
        return User.objects.filter(email__iexact=ident.lower(), is_active=True).first()
    cpf_norm = normalizar_cpf(ident)
    if cpf_valido(cpf_norm):
        profile = (
            Profile.objects.select_related("user")
            .filter(cpf=cpf_norm, user__is_active=True)
            .first()
        )
        return profile.user if profile else None
    return User.objects.filter(username__iexact=ident.lower(), is_active=True).first()


def solicitar_recuperacao_senha(identificador: str) -> str:
    """Gera OTP e envia se a conta tiver e-mail. Resposta sempre genérica."""
    user = localizar_usuario_recuperacao(identificador)
    email = (getattr(user, "email", None) or "").strip() if user else ""
    if user and email:
        codigo = f"{secrets.randbelow(1_000_000):06d}"
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.senha_codigo_hash = _hash_codigo_senha(codigo)
        profile.senha_codigo_ate = timezone.now() + timedelta(
            minutes=TTL_CODIGO_SENHA_MINUTOS
        )
        profile.save(update_fields=["senha_codigo_hash", "senha_codigo_ate"])
        enviar_email(
            "Código para redefinir senha — Universidade Money",
            (
                "Olá.\n\n"
                f"Seu código de recuperação é: {codigo}\n"
                f"Válido por {TTL_CODIGO_SENHA_MINUTOS} minutos.\n\n"
                "Se você não pediu isso, ignore este e-mail.\n"
            ),
            [email],
        )
    return MENSAGEM_GENERICA_RECUPERACAO


def confirmar_recuperacao_senha(identificador: str, codigo: str, nova_senha: str):
    """Valida o código e define a nova senha."""
    if not nova_senha or len(nova_senha) < 6:
        raise ValueError("A nova senha deve ter pelo menos 6 caracteres.")
    user = localizar_usuario_recuperacao(identificador)
    if not user:
        raise ValueError("Código inválido ou expirado.")
    profile = getattr(user, "profile", None)
    if (
        not profile
        or not profile.senha_codigo_hash
        or not profile.senha_codigo_ate
    ):
        raise ValueError("Código inválido ou expirado.")
    if timezone.now() > profile.senha_codigo_ate:
        raise ValueError("Código inválido ou expirado.")
    if _hash_codigo_senha(str(codigo or "").strip()) != profile.senha_codigo_hash:
        raise ValueError("Código inválido ou expirado.")
    user.set_password(nova_senha)
    user.save(update_fields=["password"])
    profile.senha_codigo_hash = ""
    profile.senha_codigo_ate = None
    profile.precisa_redefinir_senha = False
    profile.save(
        update_fields=[
            "senha_codigo_hash",
            "senha_codigo_ate",
            "precisa_redefinir_senha",
        ]
    )
    return user
