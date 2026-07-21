"""Endpoints MFA (TOTP) do painel — gestor e administrador."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.cursos.permissions import precisa_mfa_painel
from .mfa import (
    confirmar_enroll_totp,
    cpf_foi_verificado_mfa,
    criar_dispositivo_confiavel,
    garantir_secret_totp,
    otpauth_uri,
    qr_base64_png,
    verificar_cpf_do_usuario,
    verificar_login_totp,
    DIAS_DISPOSITIVO_CONFIAVEL,
)
from .permissions_api import IsFrontendJwtOrApiKey
from .tokens import tokens_para_usuario


class MfaSomenteGestorAdmin(permissions.BasePermission):
    message = "2FA aplica-se apenas a gestores e administradores."

    def has_permission(self, request, view):
        return precisa_mfa_painel(request.user)


def _resposta_mfa_ok(request, user):
    """JWT com mfa_ok + opcional token de dispositivo confiável."""
    payload = tokens_para_usuario(user, mfa_ok=True)
    confiar = request.data.get("confiar_dispositivo") in (True, "true", "1", 1)
    if confiar:
        ua = request.META.get("HTTP_USER_AGENT", "")
        payload["dispositivo_token"] = criar_dispositivo_confiavel(user, ua)
        payload["dispositivo_dias"] = DIAS_DISPOSITIVO_CONFIAVEL
    return Response(payload)


class MfaVerificarCpfView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, MfaSomenteGestorAdmin]

    def post(self, request):
        try:
            verificar_cpf_do_usuario(request.user, request.data.get("cpf") or "")
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        profile = request.user.profile
        return Response(
            {
                "cpf_ok": True,
                "totp_confirmado": bool(profile.totp_confirmado),
            }
        )


class MfaEnrollView(APIView):
    """Retorna QR para primeira configuração (após CPF ok)."""

    permission_classes = [IsFrontendJwtOrApiKey, MfaSomenteGestorAdmin]

    def get(self, request):
        if not cpf_foi_verificado_mfa(request.user.id):
            return Response(
                {"detail": "Confirme o CPF antes de gerar o QR Code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile = request.user.profile
        if profile.totp_confirmado:
            return Response(
                {"detail": "Autenticador já configurado. Use o código do app."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        garantir_secret_totp(request.user)
        uri = otpauth_uri(request.user)
        return Response(
            {
                "otpauth_uri": uri,
                "qr_base64": qr_base64_png(uri),
            }
        )


class MfaConfirmarView(APIView):
    """Primeiro código TOTP → ativa 2FA e emite JWT com mfa_ok."""

    permission_classes = [IsFrontendJwtOrApiKey, MfaSomenteGestorAdmin]

    def post(self, request):
        try:
            confirmar_enroll_totp(request.user, request.data.get("codigo") or "")
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return _resposta_mfa_ok(request, request.user)


class MfaVerificarView(APIView):
    """Código TOTP em logins seguintes → JWT com mfa_ok."""

    permission_classes = [IsFrontendJwtOrApiKey, MfaSomenteGestorAdmin]

    def post(self, request):
        try:
            verificar_login_totp(request.user, request.data.get("codigo") or "")
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return _resposta_mfa_ok(request, request.user)


class TokenRefreshComMfaView(APIView):
    """Refresh preservando claim mfa_ok."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.data.get("refresh") or ""
        try:
            old = RefreshToken(raw)
            mfa_ok = bool(old.get("mfa_ok", False))
            user_id = old["user_id"]
        except TokenError:
            return Response({"detail": "Token inválido ou expirado."}, status=401)

        from django.contrib.auth.models import User

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=401)

        return Response(tokens_para_usuario(user, mfa_ok=mfa_ok))
