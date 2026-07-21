"""Gate: JWT só dos nossos fronts; demais clientes exigem API Key."""
from urllib.parse import urlparse

from django.conf import settings
from rest_framework.permissions import BasePermission

from .models import ApiKeyPerm


def _normalizar_origem(valor: str) -> str:
    if not valor:
        return ""
    valor = valor.strip()
    if not valor:
        return ""
    # Referer pode vir com path — extrai scheme://netloc
    if "://" in valor:
        parsed = urlparse(valor)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    return valor.rstrip("/")


def lista_frontend_origins() -> list[str]:
    origins = getattr(settings, "FRONTEND_ORIGINS", None)
    if origins:
        return [_normalizar_origem(o) for o in origins if o]
    return [
        _normalizar_origem(o)
        for o in getattr(settings, "CORS_ALLOWED_ORIGINS", [])
        if o
    ]


def origem_frontend_confiavel(request) -> bool:
    """True se Origin (ou Referer) está na allowlist dos nossos frontends."""
    allow = set(lista_frontend_origins())
    if not allow:
        return False

    origin = _normalizar_origem(request.META.get("HTTP_ORIGIN") or "")
    if origin and origin in allow:
        return True

    referer = _normalizar_origem(request.META.get("HTTP_REFERER") or "")
    if referer and referer in allow:
        return True

    return False


def autenticado_via_api_key(request) -> bool:
    auth = getattr(request, "auth", None)
    if isinstance(auth, ApiKeyPerm):
        return auth.esta_valida()
    return False


class IsFrontendJwtOrApiKey(BasePermission):
    """
    Exige usuário autenticado e:
    - API Key válida (um_...), ou
    - JWT com Origin/Referer dos nossos frontends.
    """

    message = (
        "Acesso externo exige Authorization: Bearer um_... (API Key). "
        "JWT é permitido apenas a partir dos frontends oficiais."
    )

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not user.is_active:
            return False
        if autenticado_via_api_key(request):
            return True
        if origem_frontend_confiavel(request):
            return True
        return False


class LoginFrontendOuApiKey(BasePermission):
    """
    Login: nossos fronts (Origin) sem key; parceiros precisam de API Key válida.
    """

    message = (
        "Fora dos frontends oficiais, o login exige Authorization: Bearer um_... "
        "(token_perm de gestor/admin)."
    )

    def has_permission(self, request, view):
        if origem_frontend_confiavel(request):
            return True
        return autenticado_via_api_key(request)
