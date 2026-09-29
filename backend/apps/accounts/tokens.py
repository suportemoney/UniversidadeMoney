"""Emissão de JWT de acesso e refresh."""
from rest_framework_simplejwt.tokens import RefreshToken


def tokens_para_usuario(user):
    """Gera par access/refresh para o usuário autenticado."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
