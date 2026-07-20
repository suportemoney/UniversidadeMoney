"""Views de autenticação e token de acesso."""
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import MeUpdateSerializer, RegisterSerializer, UserSerializer
from .services import (
    SENHA_PADRAO_INICIAL,
    ativar_token_acesso,
    autenticar_por_cpf,
    buscar_token_valido,
    normalizar_chave_token,
)


class RegisterView(generics.CreateAPIView):
    """Cadastro público legado (desencorajado; preferir TokenAcesso)."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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
    permission_classes = [permissions.IsAuthenticated]

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
        return Response(UserSerializer(user).data)


class LoginView(APIView):
    """
    Login JWT.
    - Plataforma: { cpf, password }
    - Painel / legado: { username, password }
    """

    permission_classes = [permissions.AllowAny]

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

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class TokenAcessoValidarView(APIView):
    """Valida token-key e retorna username da conta vinculada."""

    permission_classes = [permissions.AllowAny]

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
    """Redefine senha + CPF e consome o token."""

    permission_classes = [permissions.AllowAny]

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
                "message": "Acesso ativado. Faça login na plataforma com CPF e a nova senha.",
                "username": user.get_username(),
            }
        )
