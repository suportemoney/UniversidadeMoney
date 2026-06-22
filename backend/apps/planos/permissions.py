"""Permissões de plano e features."""
from rest_framework import permissions

from .services import usuario_tem_acesso_aluno, usuario_tem_feature


class TemAcessoAluno(permissions.BasePermission):
    """Exige assinatura ativa ou membro da equipe de gestão."""

    message = "Ative um plano com seu token-key para acessar a plataforma."

    def has_permission(self, request, view):
        return usuario_tem_acesso_aluno(request.user)


def TemFeaturePlano(feature):
    """Factory: permissão que exige feature específica do plano."""

    class _Perm(permissions.BasePermission):
        message = "Seu plano não inclui acesso a este recurso."

        def has_permission(self, request, view):
            return usuario_tem_feature(request.user, feature)

    _Perm.__name__ = f"TemFeaturePlano_{feature}"
    return _Perm
