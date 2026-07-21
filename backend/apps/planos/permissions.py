"""Permissões de plano e features."""
from rest_framework import permissions

from .services import usuario_tem_acesso_aluno, usuario_tem_feature


class TemAcessoAluno(permissions.BasePermission):
    """Exige usuário autenticado ativo (LMS interno)."""

    message = "Faça login para acessar a plataforma."

    def has_permission(self, request, view):
        return usuario_tem_acesso_aluno(request.user)


def TemFeaturePlano(feature):
    """Factory: no modo interno equivale a autenticado com feature liberada."""

    class _Perm(permissions.BasePermission):
        message = "Você não tem acesso a este recurso."

        def has_permission(self, request, view):
            return usuario_tem_feature(request.user, feature)

    _Perm.__name__ = f"TemFeaturePlano_{feature}"
    return _Perm
