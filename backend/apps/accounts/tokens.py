"""Emissão de JWT com claim mfa_ok para o painel."""
from rest_framework_simplejwt.tokens import RefreshToken

from apps.cursos.permissions import precisa_mfa_painel


def tokens_para_usuario(user, *, mfa_ok=None):
    """
    Gera par access/refresh.
    mfa_ok=None → True se o usuário não precisa de MFA no painel; False se precisa.
    """
    if mfa_ok is None:
        mfa_ok = not precisa_mfa_painel(user)
    refresh = RefreshToken.for_user(user)
    refresh["mfa_ok"] = bool(mfa_ok)
    refresh.access_token["mfa_ok"] = bool(mfa_ok)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "mfa_ok": bool(mfa_ok),
    }


def claim_mfa_ok_do_request(request) -> bool:
    """Lê mfa_ok do access token autenticado (simplejwt)."""
    token = getattr(request, "auth", None)
    if token is None:
        return False
    try:
        return bool(token.get("mfa_ok"))
    except Exception:
        return False
