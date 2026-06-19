"""Permissões da API de gestão."""
from rest_framework.permissions import BasePermission


def usuario_pode_gestao(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    profile = getattr(user, "profile", None)
    return bool(profile and profile.is_membro_equipe)


class IsGestor(BasePermission):
    """Superuser ou membro da equipe."""

    message = "Acesso restrito à equipe de gestão."

    def has_permission(self, request, view):
        return usuario_pode_gestao(request.user)


class IsSuperuserGestao(BasePermission):
    """Somente superuser (gerenciar equipe)."""

    message = "Acesso restrito ao administrador."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
