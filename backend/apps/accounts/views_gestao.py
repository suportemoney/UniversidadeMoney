"""Gestão de convites (TokenAcesso) e colaboradores da plataforma."""
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cursos.permissions import IsGestor

from .models import TokenAcesso
from .services import criar_colaborador_com_token


class GestaoConvitesListCreateView(APIView):
    """Lista tokens de acesso e cria colaborador + token."""

    permission_classes = [permissions.IsAuthenticated, IsGestor]

    def get(self, request):
        qs = (
            TokenAcesso.objects.select_related("usuario", "criado_por")
            .order_by("-criado_em")[:200]
        )
        data = [
            {
                "id": t.id,
                "chave": t.chave,
                "username": t.usuario.get_username(),
                "first_name": t.usuario.first_name,
                "ativo": t.ativo,
                "usado_em": t.usado_em,
                "valido_ate": t.valido_ate,
                "criado_em": t.criado_em,
                "criado_por": t.criado_por.get_username() if t.criado_por else None,
                "valido": t.esta_valido(),
            }
            for t in qs
        ]
        return Response(data)

    def post(self, request):
        username = request.data.get("username") or ""
        first_name = request.data.get("first_name") or request.data.get("nome") or ""
        email = request.data.get("email") or ""
        cargo = request.data.get("cargo") or "Colaborador"
        try:
            user, token = criar_colaborador_com_token(
                username=username,
                first_name=first_name,
                email=email,
                cargo=cargo,
                criado_por=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "id": token.id,
                "chave": token.chave,
                "username": user.get_username(),
                "first_name": user.first_name,
                "senha_padrao": "123456",
                "message": "Colaborador criado. Envie o token-key para ativação em interno.",
            },
            status=status.HTTP_201_CREATED,
        )


class GestaoConviteRevogarView(APIView):
    """Desativa um token ainda não usado."""

    permission_classes = [permissions.IsAuthenticated, IsGestor]

    def post(self, request, pk):
        try:
            token = TokenAcesso.objects.get(pk=pk)
        except TokenAcesso.DoesNotExist:
            return Response({"detail": "Token não encontrado."}, status=404)
        token.ativo = False
        token.save(update_fields=["ativo"])
        return Response({"message": "Token revogado.", "id": token.id})


class GestaoConviteRegenerarView(APIView):
    """Gera novo token para um usuário (revoga ativos anteriores)."""

    permission_classes = [permissions.IsAuthenticated, IsGestor]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=404)

        TokenAcesso.objects.filter(usuario=user, ativo=True, usado_em__isnull=True).update(
            ativo=False
        )
        token = TokenAcesso.objects.create(usuario=user, criado_por=request.user)
        return Response(
            {
                "id": token.id,
                "chave": token.chave,
                "username": user.get_username(),
                "senha_padrao": "123456",
            },
            status=status.HTTP_201_CREATED,
        )
