"""Gestão de convites (TokenAcesso) e colaboradores da plataforma."""
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions_api import IsFrontendJwtOrApiKey

from apps.accounts.models import Profile
from apps.cursos.permissions import (
    NIVEL_ADMINISTRADOR,
    PodeConvites,
    nivel_do_usuario,
)

from .models import TokenAcesso
from .services import criar_colaborador_com_token, resetar_senha_padrao


def _perfil_usuario_convite(user):
    """Dados completos do colaborador para visualização no painel de convites."""
    profile = getattr(user, "profile", None)
    setor = getattr(profile, "setor", None) if profile else None
    return {
        "usuario_id": user.id,
        "username": user.get_username(),
        "first_name": user.first_name or "",
        "email": user.email or "",
        "cpf": profile.cpf if profile else None,
        "cargo": (profile.cargo if profile else "") or "",
        "nivel_acesso": nivel_do_usuario(user),
        "setor_id": setor.id if setor else None,
        "setor_nome": setor.nome if setor else None,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "is_membro_equipe": bool(profile.is_membro_equipe) if profile else False,
        "precisa_redefinir_senha": bool(profile.precisa_redefinir_senha) if profile else False,
        "totp_confirmado": bool(getattr(profile, "totp_confirmado", False)) if profile else False,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
    }


class GestaoConvitesListCreateView(APIView):
    """Lista tokens de acesso e cria colaborador + token."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeConvites]

    def get(self, request):
        qs = (
            TokenAcesso.objects.select_related(
                "usuario", "usuario__profile", "usuario__profile__setor", "criado_por"
            )
            .order_by("-criado_em")[:200]
        )
        data = []
        for t in qs:
            row = {
                "id": t.id,
                "chave": t.chave,
                "usuario_id": t.usuario_id,
                "username": t.usuario.get_username(),
                "first_name": t.usuario.first_name,
                "nivel_acesso": nivel_do_usuario(t.usuario),
                "ativo": t.ativo,
                "usado_em": t.usado_em,
                "valido_ate": t.valido_ate,
                "criado_em": t.criado_em,
                "criado_por": t.criado_por.get_username() if t.criado_por else None,
                "valido": t.esta_valido(),
            }
            row.update(_perfil_usuario_convite(t.usuario))
            data.append(row)
        return Response(data)

    def post(self, request):
        username = request.data.get("username") or ""
        first_name = request.data.get("first_name") or request.data.get("nome") or ""
        email = request.data.get("email") or ""
        cpf = request.data.get("cpf") or ""
        nivel = (request.data.get("nivel_acesso") or Profile.NIVEL_PADRAO).strip().lower()
        cargo = request.data.get("cargo") or ""

        validos = {c[0] for c in Profile.NIVEL_CHOICES}
        if nivel not in validos:
            return Response({"detail": "Nível de acesso inválido."}, status=400)

        # Gestor não pode criar administrador
        if nivel == NIVEL_ADMINISTRADOR and nivel_do_usuario(request.user) != NIVEL_ADMINISTRADOR:
            return Response(
                {"detail": "Apenas administradores podem convidar outro administrador."},
                status=403,
            )

        try:
            user, token = criar_colaborador_com_token(
                username=username,
                first_name=first_name,
                email=email,
                cpf=cpf,
                cargo=cargo,
                nivel_acesso=nivel,
                criado_por=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "id": token.id,
                "chave": token.chave,
                "usuario_id": user.id,
                "username": user.get_username(),
                "first_name": user.first_name,
                "nivel_acesso": nivel_do_usuario(user),
                "senha_padrao": "123456",
                "message": "Colaborador criado. Envie o token-key para ativação em interno.",
            },
            status=status.HTTP_201_CREATED,
        )


class GestaoConviteRevogarView(APIView):
    """Desativa um token ainda não usado."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeConvites]

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

    permission_classes = [IsFrontendJwtOrApiKey, PodeConvites]

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


class GestaoConviteRedefinirSenhaView(APIView):
    """Volta a senha do colaborador para 123456 e exige nova senha no próximo login."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeConvites]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=404)

        if user.is_superuser and user.id != request.user.id:
            # Evita reset acidental de outro superuser por gestor
            if nivel_do_usuario(request.user) != NIVEL_ADMINISTRADOR:
                return Response(
                    {"detail": "Apenas administradores podem redefinir senha de administrador."},
                    status=403,
                )

        resetar_senha_padrao(user)
        return Response(
            {
                "message": "Senha redefinida para 123456. No próximo login o colaborador deverá escolher outra senha.",
                "usuario_id": user.id,
                "senha_padrao": "123456",
            }
        )


class GestaoConvitePerfilView(APIView):
    """Detalhe do perfil do colaborador vinculado ao convite."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeConvites]

    def get(self, request, user_id):
        try:
            user = User.objects.select_related("profile", "profile__setor").get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=404)
        return Response(_perfil_usuario_convite(user))
