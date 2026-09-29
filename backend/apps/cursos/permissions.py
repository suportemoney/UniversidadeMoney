"""Níveis de acesso e helpers de autorização do painel."""
from rest_framework.permissions import BasePermission

from apps.accounts.models import Profile

NIVEL_PADRAO = Profile.NIVEL_PADRAO
NIVEL_INSTRUTOR = Profile.NIVEL_INSTRUTOR
NIVEL_GESTOR = Profile.NIVEL_GESTOR
NIVEL_ADMINISTRADOR = Profile.NIVEL_ADMINISTRADOR

NIVEIS_PAINEL = {NIVEL_INSTRUTOR, NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
NIVEIS_EQUIPE = {NIVEL_INSTRUTOR, NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
NIVEIS_CONVITES = {NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
NIVEIS_GESTOR_MAIS = {NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
LABELS_NIVEL = dict(Profile.NIVEL_CHOICES)


def eh_membro_equipe_gestao(user) -> bool:
    """Instrutor, gestor, administrador ou superuser (lista Equipe)."""
    if not user:
        return False
    if getattr(user, "is_superuser", False):
        return True
    return nivel_do_usuario(user) in NIVEIS_EQUIPE


def nivel_do_usuario(user) -> str:
    if not user or not user.is_authenticated:
        return NIVEL_PADRAO
    if user.is_superuser:
        return NIVEL_ADMINISTRADOR
    profile = getattr(user, "profile", None)
    if not profile:
        return NIVEL_PADRAO
    nivel = getattr(profile, "nivel_acesso", None) or NIVEL_PADRAO
    # Superuser legado sem campo sincronizado
    if user.is_superuser:
        return NIVEL_ADMINISTRADOR
    return nivel


def pode_painel(user) -> bool:
    return nivel_do_usuario(user) in NIVEIS_PAINEL


def pode_api(user) -> bool:
    return nivel_do_usuario(user) == NIVEL_ADMINISTRADOR


def pode_convites(user) -> bool:
    return nivel_do_usuario(user) in NIVEIS_CONVITES


def pode_gestor_ou_admin(user) -> bool:
    """Gestor, administrador ou superuser (via nivel_do_usuario)."""
    return nivel_do_usuario(user) in NIVEIS_GESTOR_MAIS


def pode_equipe(user) -> bool:
    return nivel_do_usuario(user) == NIVEL_ADMINISTRADOR


def pode_excluir(user) -> bool:
    return nivel_do_usuario(user) == NIVEL_ADMINISTRADOR


def escopo_cursos_apenas(user) -> bool:
    return nivel_do_usuario(user) == NIVEL_INSTRUTOR


def usuario_pode_gestao(user) -> bool:
    """Compat: entrada no painel (instrutor+)."""
    return pode_painel(user)


def aplicar_nivel_acesso(user, nivel: str):
    """Sincroniza flags Django/Profile com o nível informado."""
    nivel = (nivel or NIVEL_PADRAO).strip().lower()
    validos = {c[0] for c in Profile.NIVEL_CHOICES}
    if nivel not in validos:
        raise ValueError(f"Nível de acesso inválido: {nivel}")

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.nivel_acesso = nivel
    # cargo espelha o rótulo do nível (legado)
    profile.cargo = LABELS_NIVEL.get(nivel, nivel)

    if nivel == NIVEL_ADMINISTRADOR:
        profile.is_membro_equipe = True
        user.is_staff = True
        user.is_superuser = True
    elif nivel in (NIVEL_INSTRUTOR, NIVEL_GESTOR):
        profile.is_membro_equipe = True
        user.is_staff = False
        user.is_superuser = False
    else:
        profile.is_membro_equipe = False
        user.is_staff = False
        user.is_superuser = False

    profile.save(update_fields=["nivel_acesso", "cargo", "is_membro_equipe"])
    user.save(update_fields=["is_staff", "is_superuser"])
    return profile


class IsGestor(BasePermission):
    """Instrutor, gestor ou administrador (acesso ao painel)."""

    message = "Acesso restrito à equipe de gestão."

    def has_permission(self, request, view):
        return pode_painel(request.user)


class IsSuperuserGestao(BasePermission):
    """Somente administrador (equipe)."""

    message = "Acesso restrito ao administrador."

    def has_permission(self, request, view):
        return pode_equipe(request.user)


class PodeConvites(BasePermission):
    message = "Apenas gestores e administradores podem gerenciar convites."

    def has_permission(self, request, view):
        return pode_convites(request.user)


class PodeGestorOuAdmin(BasePermission):
    message = "Apenas gestores e administradores podem alterar a ordem das aulas."

    def has_permission(self, request, view):
        return pode_gestor_ou_admin(request.user)


class PodeApiDocs(BasePermission):
    message = "Acesso à API restrito ao administrador."

    def has_permission(self, request, view):
        return pode_api(request.user)


class PodeEquipe(BasePermission):
    message = "Acesso à equipe restrito ao administrador."

    def has_permission(self, request, view):
        return pode_equipe(request.user)


class PodeExcluir(BasePermission):
    message = "Exclusão permanente restrita ao administrador. Use inativar/arquivar."

    def has_permission(self, request, view):
        if request.method != "DELETE":
            return True
        return pode_excluir(request.user)


class EscopoNaoSomenteCursos(BasePermission):
    """Bloqueia instrutor em áreas fora de cursos."""

    message = "Instrutores têm acesso limitado à gestão de cursos."

    def has_permission(self, request, view):
        if not pode_painel(request.user):
            return False
        if escopo_cursos_apenas(request.user):
            return False
        return True
