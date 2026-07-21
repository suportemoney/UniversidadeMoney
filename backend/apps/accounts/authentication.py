"""Autenticação por API Key (Bearer um_...)."""
from django.utils import timezone
from rest_framework import authentication, exceptions

from .api_keys import (
    PREFIX_LEN,
    PREFIX_PERM,
    PREFIX_TEMP,
    hash_chave,
    marcar_uso_api_key,
)
from .models import ApiKeyPerm


class ApiKeyAuthentication(authentication.BaseAuthentication):
    """
    Lê Authorization: Bearer um_... e autentica o usuário dono da chave.
    JWT continua sendo o padrão para humanos no painel/plataforma.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).decode("utf-8")
        if not auth:
            return None
        parts = auth.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None
        token = parts[1].strip()
        if not token.startswith(PREFIX_PERM) or token.startswith(PREFIX_TEMP):
            return None
        if len(token) < PREFIX_LEN + 8:
            return None

        prefix = token[:PREFIX_LEN]
        key_hash = hash_chave(token)
        try:
            api_key = ApiKeyPerm.objects.select_related("usuario").get(
                prefix=prefix, key_hash=key_hash
            )
        except ApiKeyPerm.DoesNotExist:
            raise exceptions.AuthenticationFailed("API Key inválida ou revogada.")

        if api_key.revogado_em is not None:
            raise exceptions.AuthenticationFailed("API Key inválida ou revogada.")

        if api_key.valido_ate and timezone.now() > api_key.valido_ate:
            raise exceptions.AuthenticationFailed("API Key expirada.")

        if not api_key.usuario_id or not api_key.usuario.is_active:
            raise exceptions.AuthenticationFailed(
                "Usuário da integração inativo. A API Key deixou de funcionar."
            )

        marcar_uso_api_key(api_key)
        return (api_key.usuario, api_key)
