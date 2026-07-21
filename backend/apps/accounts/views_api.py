"""Views de troca de token e documentação/gestão de API Keys."""
import time
from collections import defaultdict
from .permissions_api import IsFrontendJwtOrApiKey

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cursos.permissions import PodeApiDocs

from .api_keys import (
    CATALOGO_ENDPOINTS,
    GUIA_INTEGRACAO,
    criar_token_temp,
    revogar_api_key,
    serializar_api_key,
    trocar_token_temp_por_perm,
)
from .models import ApiKeyPerm

# Rate limit simples em memória (por IP)
_TROCA_TENTATIVAS: dict[str, list[float]] = defaultdict(list)
_TROCA_JANELA_S = 300
_TROCA_MAX = 20


def _cliente_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or "unknown"


def _rate_limit_ok(ip: str) -> bool:
    agora = time.time()
    janela = [t for t in _TROCA_TENTATIVAS[ip] if agora - t < _TROCA_JANELA_S]
    _TROCA_TENTATIVAS[ip] = janela
    if len(janela) >= _TROCA_MAX:
        return False
    janela.append(agora)
    return True


class ApiTokenTrocarView(APIView):
    """POST { token_temp, username, password, nome?, validade_dias? } → token_perm."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        ip = _cliente_ip(request)
        if not _rate_limit_ok(ip):
            return Response(
                {"detail": "Muitas tentativas. Aguarde alguns minutos."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        token_temp = request.data.get("token_temp") or ""
        username = request.data.get("username") or ""
        password = request.data.get("password") or ""
        nome = request.data.get("nome") or ""
        validade_dias = request.data.get("validade_dias")

        try:
            dias = int(validade_dias) if validade_dias is not None else None
        except (TypeError, ValueError):
            return Response({"detail": "validade_dias inválido."}, status=400)

        try:
            api_key, plaintext = trocar_token_temp_por_perm(
                token_temp=token_temp,
                username=username,
                password=password,
                nome=nome,
                validade_dias=dias,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "token_perm": plaintext,
                "prefix": api_key.prefix,
                "valido_ate": api_key.valido_ate,
                "nome": api_key.nome,
                "username": api_key.usuario.get_username(),
                "message": "Guarde o token_perm agora; ele não será exibido novamente.",
            },
            status=status.HTTP_201_CREATED,
        )


class GestaoApiDocsCatalogoView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeApiDocs]

    def get(self, request):
        return Response({"guia": GUIA_INTEGRACAO, "endpoints": CATALOGO_ENDPOINTS})


class GestaoApiTokensListView(APIView):
    """Lista API Keys permanentes (sem secret) e gera token_temp."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeApiDocs]

    def get(self, request):
        qs = ApiKeyPerm.objects.select_related("usuario", "criado_por").order_by(
            "-criado_em"
        )[:200]
        return Response([serializar_api_key(k) for k in qs])


class GestaoApiTokenTempCreateView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeApiDocs]

    def post(self, request):
        validade_minutos = request.data.get("validade_minutos", 30)
        try:
            minutos = int(validade_minutos)
        except (TypeError, ValueError):
            return Response({"detail": "validade_minutos inválido."}, status=400)

        obj, plaintext = criar_token_temp(
            criado_por=request.user, validade_minutos=minutos
        )
        return Response(
            {
                "id": obj.id,
                "token_temp": plaintext,
                "prefix": obj.prefix,
                "valido_ate": obj.valido_ate,
                "message": "Use token_temp + username + password em POST /api/auth/api-tokens/trocar/",
            },
            status=status.HTTP_201_CREATED,
        )


class GestaoApiTokenRevogarView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeApiDocs]

    def post(self, request, pk):
        try:
            api_key = ApiKeyPerm.objects.get(pk=pk)
        except ApiKeyPerm.DoesNotExist:
            return Response({"detail": "API Key não encontrada."}, status=404)
        revogar_api_key(api_key)
        return Response({"message": "API Key revogada.", "id": api_key.id})
