"""Views de autenticação e token de acesso."""
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import ApiKeyAuthentication
from .permissions_api import IsFrontendJwtOrApiKey, LoginFrontendOuApiKey
from .serializers import MeUpdateSerializer, RegisterSerializer, UserSerializer
from .services import (
    SENHA_PADRAO_INICIAL,
    ativar_token_acesso,
    autenticar_por_cpf,
    buscar_token_valido,
    normalizar_chave_token,
    redefinir_senha_obrigatoria,
)
from .tokens import claim_mfa_ok_do_request, tokens_para_usuario
from apps.cursos.permissions import precisa_mfa_painel
from .mfa import validar_dispositivo_confiavel


class RegisterView(generics.CreateAPIView):
    """Cadastro público legado (desencorajado; preferir TokenAcesso)."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Conta criada com sucesso."},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Retorna e atualiza dados do usuário autenticado."""

    serializer_class = UserSerializer
    permission_classes = [IsFrontendJwtOrApiKey]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["mfa_ok"] = claim_mfa_ok_do_request(self.request)
        return ctx

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = MeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "first_name" in data:
            user.first_name = data["first_name"]
            user.save(update_fields=["first_name"])
        if "cargo" in data and hasattr(user, "profile"):
            user.profile.cargo = data["cargo"]
            user.profile.save(update_fields=["cargo"])
        return Response(UserSerializer(user, context=self.get_serializer_context()).data)


class LoginView(APIView):
    """
    Login JWT.
    - Nossos fronts (Origin confiável): username/senha ou CPF sem API Key.
    - Parceiros: exigem Bearer um_... (token_perm) + credenciais no body.
    - Gestor/admin: mfa_ok=false até concluir 2FA no painel.
    """

    permission_classes = [LoginFrontendOuApiKey]
    authentication_classes = [ApiKeyAuthentication]

    def post(self, request):
        password = request.data.get("password") or ""
        cpf = request.data.get("cpf")
        username = request.data.get("username")

        user = None
        if cpf:
            user = autenticar_por_cpf(cpf, password)
        elif username:
            try:
                candidate = User.objects.get(username=username.strip().lower())
            except User.DoesNotExist:
                try:
                    candidate = User.objects.get(username=username.strip())
                except User.DoesNotExist:
                    candidate = None
            if candidate and candidate.is_active and candidate.check_password(password):
                user = candidate

        if not user:
            return Response(
                {"detail": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Gestor/admin: dispositivo confiável dispensa TOTP nesta máquina
        mfa_ok = None
        if precisa_mfa_painel(user):
            device_token = request.data.get("dispositivo_token") or ""
            mfa_ok = validar_dispositivo_confiavel(user, device_token)

        return Response(tokens_para_usuario(user, mfa_ok=mfa_ok))


class RedefinirSenhaObrigatoriaView(APIView):
    """Troca senha quando precisa_redefinir_senha (confirma CPF)."""

    permission_classes = [IsFrontendJwtOrApiKey]

    def post(self, request):
        try:
            redefinir_senha_obrigatoria(
                request.user,
                request.data.get("cpf") or "",
                request.data.get("nova_senha") or "",
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "message": "Senha atualizada.",
                **tokens_para_usuario(request.user),
            }
        )


class TokenAcessoValidarView(APIView):
    """Valida token-key e retorna username da conta vinculada."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        chave = normalizar_chave_token(request.data.get("chave") or "")
        token = buscar_token_valido(chave)
        if not token:
            return Response(
                {"detail": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "valido": True,
                "username": token.usuario.get_username(),
                "senha_padrao": SENHA_PADRAO_INICIAL,
                "precisa_setup": True,
            }
        )


class TokenAcessoAtivarView(APIView):
    """Redefine senha + confere CPF e consome o token."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        chave = request.data.get("chave") or ""
        nova_senha = request.data.get("nova_senha") or ""
        cpf = request.data.get("cpf") or ""
        try:
            user = ativar_token_acesso(chave, nova_senha, cpf)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "message": "Acesso ativado. Faça login na plataforma com CPF ou usuário e a nova senha.",
                "username": user.get_username(),
            }
        )
