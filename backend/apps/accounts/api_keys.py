"""Geração e troca de tokens de integração (hash SHA-256, só ORM)."""
import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone

from apps.cursos.permissions import usuario_pode_gestao

from .models import ApiKeyPerm, TokenTempApi

PREFIX_TEMP = "umt_"
PREFIX_PERM = "um_"
PREFIX_LEN = 12
TEMP_VALIDADE_MINUTOS = 30
PERM_VALIDADE_DIAS_PADRAO = 365


def hash_chave(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()


def _gerar_token(prefixo: str) -> tuple[str, str, str]:
    """Retorna (plaintext, prefix, key_hash)."""
    secreto = secrets.token_urlsafe(32)
    plaintext = f"{prefixo}{secreto}"
    prefix = plaintext[:PREFIX_LEN]
    return plaintext, prefix, hash_chave(plaintext)


def criar_token_temp(*, criado_por, validade_minutos: int = TEMP_VALIDADE_MINUTOS):
    """Cria TokenTempApi; retorna (obj, plaintext) — plaintext só nesta resposta."""
    minutos = max(5, min(int(validade_minutos or TEMP_VALIDADE_MINUTOS), 60))
    plaintext, prefix, key_hash = _gerar_token(PREFIX_TEMP)
    obj = TokenTempApi.objects.create(
        prefix=prefix,
        key_hash=key_hash,
        criado_por=criado_por,
        valido_ate=timezone.now() + timedelta(minutes=minutos),
    )
    return obj, plaintext


def buscar_token_temp_valido(plaintext: str):
    if not plaintext or not isinstance(plaintext, str):
        return None
    chave = plaintext.strip()
    if not chave.startswith(PREFIX_TEMP) or len(chave) < PREFIX_LEN + 8:
        return None
    prefix = chave[:PREFIX_LEN]
    key_hash = hash_chave(chave)
    try:
        token = TokenTempApi.objects.get(prefix=prefix, key_hash=key_hash)
    except TokenTempApi.DoesNotExist:
        return None
    if not token.esta_valido():
        return None
    return token


@transaction.atomic
def trocar_token_temp_por_perm(
    *,
    token_temp: str,
    username: str,
    password: str,
    nome: str = "",
    validade_dias: int | None = None,
    criado_por=None,
):
    """
    Valida temp (uso único), autentica usuário/senha e emite ApiKeyPerm.
    Retorna (api_key, plaintext).
    """
    temp = buscar_token_temp_valido(token_temp)
    if temp is None:
        raise ValueError("Token temporário inválido ou expirado.")

    user = authenticate(username=(username or "").strip(), password=password or "")
    if user is None or not user.is_active:
        raise ValueError("Usuário ou senha inválidos.")
    if not usuario_pode_gestao(user):
        raise ValueError(
            "Apenas gestor ou administrador pode emitir token_perm de integração."
        )

    # Consome o temp antes de criar a permanente
    temp.usado_em = timezone.now()
    temp.ativo = False
    temp.save(update_fields=["usado_em", "ativo"])

    dias = validade_dias if validade_dias is not None else PERM_VALIDADE_DIAS_PADRAO
    dias = max(1, min(int(dias), 3650))
    plaintext, prefix, key_hash = _gerar_token(PREFIX_PERM)
    api_key = ApiKeyPerm.objects.create(
        nome=(nome or "").strip()[:120] or f"Integração {user.get_username()}",
        prefix=prefix,
        key_hash=key_hash,
        usuario=user,
        valido_ate=timezone.now() + timedelta(days=dias),
        criado_por=criado_por or user,
    )
    return api_key, plaintext


def resolver_api_key(plaintext: str):
    """Resolve Bearer um_... para ApiKeyPerm válida ou None."""
    if not plaintext or not isinstance(plaintext, str):
        return None
    chave = plaintext.strip()
    if not chave.startswith(PREFIX_PERM) or len(chave) < PREFIX_LEN + 8:
        return None
    # Não confundir com umt_
    if chave.startswith(PREFIX_TEMP):
        return None
    prefix = chave[:PREFIX_LEN]
    key_hash = hash_chave(chave)
    try:
        api_key = ApiKeyPerm.objects.select_related("usuario").get(
            prefix=prefix, key_hash=key_hash
        )
    except ApiKeyPerm.DoesNotExist:
        return None
    if not api_key.esta_valida():
        return None
    return api_key


def marcar_uso_api_key(api_key: ApiKeyPerm):
    ApiKeyPerm.objects.filter(pk=api_key.pk).update(ultimo_uso=timezone.now())


def serializar_api_key(api_key: ApiKeyPerm) -> dict:
    return {
        "id": api_key.id,
        "nome": api_key.nome,
        "prefix": api_key.prefix,
        "username": api_key.usuario.get_username(),
        "valido_ate": api_key.valido_ate,
        "revogado_em": api_key.revogado_em,
        "ultimo_uso": api_key.ultimo_uso,
        "criado_em": api_key.criado_em,
        "criado_por": api_key.criado_por.get_username() if api_key.criado_por_id else None,
        "ativa": api_key.esta_valida(),
    }


def revogar_api_key(api_key: ApiKeyPerm):
    if api_key.revogado_em is None:
        api_key.revogado_em = timezone.now()
        api_key.save(update_fields=["revogado_em"])
    return api_key


# Catálogo estático para a aba API do painel
AUTH_PARCEIRO = "API Key (Bearer um_...) — obrigatória fora dos nossos fronts"
AUTH_NOSSOS_FRONTS = "JWT nos nossos fronts; API Key para sistemas parceiros"

GUIA_INTEGRACAO = {
    "titulo": "Como usar a API de integração",
    "resumo": (
        "token_perm é emitido apenas por gestor/admin. "
        "Alunos da empresa parceira autenticam no front deles; "
        "o backend parceiro chama nossas APIs com a API Key."
    ),
    "passos": [
        {
            "ordem": 1,
            "titulo": "Gerar token_temp no painel",
            "texto": (
                "No painel Gestão → API, um gestor gera token_temp "
                "(válido ~30 min, uso único). Copie na hora."
            ),
        },
        {
            "ordem": 2,
            "titulo": "Trocar por token_perm",
            "texto": (
                "O sistema parceiro chama POST /api/auth/api-tokens/trocar/ "
                "com token_temp + username/senha de gestor ou administrador. "
                "Recebe token_perm (um_...) uma única vez."
            ),
            "endpoint": "/api/auth/api-tokens/trocar/",
            "metodo": "POST",
        },
        {
            "ordem": 3,
            "titulo": "Guardar no .env",
            "texto": (
                "Salve UNIVERSIDADE_API_URL e UNIVERSIDADE_API_TOKEN=um_... "
                "no ambiente do sistema parceiro."
            ),
        },
        {
            "ordem": 4,
            "titulo": "Chamar GET/POST com Bearer",
            "texto": (
                "Em toda requisição (incluindo login, se usar o nosso /auth/login/), "
                "envie Authorization: Bearer um_.... "
                "Nossos frontends (plataforma/painel/interno) não precisam de API Key."
            ),
        },
        {
            "ordem": 5,
            "titulo": "Usuário inativo",
            "texto": (
                "Se o usuário gestor vinculado ao token_perm for inativado, "
                "a API Key deixa de autenticar imediatamente."
            ),
        },
    ],
    "exemplos": [
        {
            "id": "trocar",
            "titulo": "Trocar token_temp → token_perm",
            "metodo": "POST",
            "path": "/api/auth/api-tokens/trocar/",
            "auth": False,
            "body": {
                "token_temp": "umt_...",
                "username": "admin",
                "password": "***",
                "nome": "ERP parceiro",
                "validade_dias": 365,
            },
        },
        {
            "id": "login",
            "titulo": "Login (parceiro — exige API Key)",
            "metodo": "POST",
            "path": "/api/auth/login/",
            "auth": True,
            "body": {"username": "aluno_parceiro", "password": "***"},
        },
        {
            "id": "cursos",
            "titulo": "Listar cursos (GET)",
            "metodo": "GET",
            "path": "/api/cursos/",
            "auth": True,
            "body": None,
        },
        {
            "id": "me",
            "titulo": "Usuário da key (GET)",
            "metodo": "GET",
            "path": "/api/auth/me/",
            "auth": True,
            "body": None,
        },
    ],
}

CATALOGO_ENDPOINTS = [
    {
        "grupo": "Integração",
        "metodo": "POST",
        "path": "/api/auth/api-tokens/trocar/",
        "auth": "nenhuma (token_temp + gestor/admin)",
        "descricao": "Troca token_temp + credenciais de gestor por token_perm (uma vez).",
        "body_exemplo": {
            "token_temp": "umt_...",
            "username": "admin",
            "password": "***",
            "nome": "ERP RH",
            "validade_dias": 365,
        },
    },
    {
        "grupo": "Autenticação",
        "metodo": "POST",
        "path": "/api/auth/login/",
        "auth": "Nossos fronts: sem key. Parceiro: Bearer um_...",
        "descricao": "Emite JWT. Fora dos nossos fronts exige API Key de gestor.",
        "body_exemplo": {"username": "admin", "password": "***"},
    },
    {
        "grupo": "Autenticação",
        "metodo": "GET",
        "path": "/api/auth/me/",
        "auth": AUTH_NOSSOS_FRONTS,
        "descricao": "Dados do usuário autenticado (JWT ou dono da API Key).",
    },
    {
        "grupo": "Catálogo",
        "metodo": "GET",
        "path": "/api/cursos/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Lista cursos publicados.",
    },
    {
        "grupo": "Catálogo",
        "metodo": "GET",
        "path": "/api/cursos/{id}/detalhe/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Detalhe de um curso.",
    },
    {
        "grupo": "Catálogo",
        "metodo": "GET",
        "path": "/api/trilhas/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Lista trilhas.",
    },
    {
        "grupo": "Catálogo",
        "metodo": "GET",
        "path": "/api/trilhas/{id}/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Detalhe de uma trilha.",
    },
    {
        "grupo": "Aluno",
        "metodo": "GET",
        "path": "/api/meus-cursos/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Cursos do usuário autenticado pela key/JWT.",
    },
    {
        "grupo": "Aluno",
        "metodo": "GET",
        "path": "/api/dashboard/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Resumo do dashboard.",
    },
    {
        "grupo": "Extras",
        "metodo": "GET",
        "path": "/api/ao-vivo/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Treinamentos ao vivo.",
    },
    {
        "grupo": "Extras",
        "metodo": "GET",
        "path": "/api/biblioteca/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Materiais da biblioteca.",
    },
    {
        "grupo": "Extras",
        "metodo": "GET",
        "path": "/api/comunicados/",
        "auth": AUTH_PARCEIRO,
        "descricao": "Comunicados.",
    },
]
