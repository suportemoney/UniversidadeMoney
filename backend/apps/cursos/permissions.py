"""Níveis de acesso e helpers de autorização do painel."""
from rest_framework.permissions import BasePermission

from apps.accounts.models import Profile

NIVEL_PADRAO = Profile.NIVEL_PADRAO
NIVEL_INSTRUTOR = Profile.NIVEL_INSTRUTOR
NIVEL_GESTOR = Profile.NIVEL_GESTOR
NIVEL_ADMINISTRADOR = Profile.NIVEL_ADMINISTRADOR

NIVEIS_PAINEL = {NIVEL_INSTRUTOR, NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
NIVEIS_CONVITES = {NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
NIVEIS_MFA = {NIVEL_GESTOR, NIVEL_ADMINISTRADOR}
LABELS_NIVEL = dict(Profile.NIVEL_CHOICES)


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


def precisa_mfa_painel(user) -> bool:
    """Gestor e administrador precisam de 2FA no painel."""
    return nivel_do_usuario(user) in NIVEIS_MFA


def mfa_ok_no_request(request) -> bool:
    from apps.accounts.tokens import claim_mfa_ok_do_request

    return claim_mfa_ok_do_request(request)


def gestao_com_mfa_ok(request) -> bool:
    """Painel: quem precisa de MFA deve ter claim mfa_ok no JWT."""
    if not pode_painel(request.user):
        return False
    if precisa_mfa_painel(request.user) and not mfa_ok_no_request(request):
        return False
    return True


def pode_api(user) -> bool:
    return nivel_do_usuario(user) == NIVEL_ADMINISTRADOR


def pode_convites(user) -> bool:
    return nivel_do_usuario(user) in NIVEIS_CONVITES


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
    """Instrutor, gestor ou administrador (acesso ao painel; MFA se aplicável)."""

    message = "Acesso restrito à equipe de gestão."

    def has_permission(self, request, view):
        if not gestao_com_mfa_ok(request):
            self.message = (
                "Conclua a autenticação em duas etapas do painel."
                if pode_painel(request.user) and precisa_mfa_painel(request.user)
                else "Acesso restrito à equipe de gestão."
            )
            return False
        return True


class IsSuperuserGestao(BasePermission):
    """Somente administrador (equipe)."""

    message = "Acesso restrito ao administrador."

    def has_permission(self, request, view):
        return pode_equipe(request.user) and gestao_com_mfa_ok(request)


class PodeConvites(BasePermission):
    message = "Apenas gestores e administradores podem gerenciar convites."

    def has_permission(self, request, view):
        return pode_convites(request.user) and gestao_com_mfa_ok(request)


class PodeApiDocs(BasePermission):
    message = "Acesso à API restrito ao administrador."

    def has_permission(self, request, view):
        return pode_api(request.user) and gestao_com_mfa_ok(request)


class PodeEquipe(BasePermission):
    message = "Acesso à equipe restrito ao administrador."

    def has_permission(self, request, view):
        return pode_equipe(request.user) and gestao_com_mfa_ok(request)


class PodeExcluir(BasePermission):
    message = "Exclusão permanente restrita ao administrador. Use inativar/arquivar."

    def has_permission(self, request, view):
        if request.method != "DELETE":
            return True
        return pode_excluir(request.user) and gestao_com_mfa_ok(request)


class EscopoNaoSomenteCursos(BasePermission):
    """Bloqueia instrutor em áreas fora de cursos."""

    message = "Instrutores têm acesso limitado à gestão de cursos."

    def has_permission(self, request, view):
        if not gestao_com_mfa_ok(request):
            return False
        if escopo_cursos_apenas(request.user):
            return False
        return True
