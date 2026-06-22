"""Lógica de planos, tokens e assinaturas."""
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.cursos.permissions import usuario_pode_gestao

from .models import AssinaturaUsuario, Plano, TokenPlano

FEATURES_GESTAO = {
    "acesso_cursos": True,
    "acesso_trilhas": True,
    "acesso_biblioteca": True,
    "acesso_ao_vivo": True,
    "acesso_certificados": True,
    "acesso_ranking": True,
    "acesso_comunicados": True,
    "acesso_progresso": True,
}


def expirar_assinaturas_vencidas(usuario):
    """Marca assinaturas ativas vencidas como expiradas."""
    agora = timezone.now()
    AssinaturaUsuario.objects.filter(
        usuario=usuario,
        status=AssinaturaUsuario.STATUS_ATIVA,
        expira_em__lte=agora,
    ).update(status=AssinaturaUsuario.STATUS_EXPIRADA)


def assinatura_ativa(usuario):
    """Retorna assinatura vigente ou None."""
    if not usuario or not usuario.is_authenticated:
        return None
    expirar_assinaturas_vencidas(usuario)
    return (
        AssinaturaUsuario.objects.filter(
            usuario=usuario,
            status=AssinaturaUsuario.STATUS_ATIVA,
            expira_em__gt=timezone.now(),
        )
        .select_related("plano")
        .order_by("-expira_em")
        .first()
    )


def usuario_tem_acesso_aluno(usuario):
    """Gestão bypass ou assinatura ativa."""
    if usuario_pode_gestao(usuario):
        return True
    return assinatura_ativa(usuario) is not None


def features_efetivas(usuario):
    """Dict de features disponíveis para o usuário."""
    if usuario_pode_gestao(usuario):
        return dict(FEATURES_GESTAO)
    assin = assinatura_ativa(usuario)
    if not assin:
        return {k: False for k in FEATURES_GESTAO}
    return assin.plano.features_dict()


def usuario_tem_feature(usuario, feature):
    return features_efetivas(usuario).get(feature, False)


def tag_ids_do_plano_ativo(usuario):
    """
    IDs de tags permitidas pelo plano ativo.
    None = gestão (sem filtro). [] = sem tags / sem plano (nenhum curso novo).
    """
    if usuario_pode_gestao(usuario):
        return None
    assin = assinatura_ativa(usuario)
    if not assin:
        return []
    return list(
        assin.plano.tags_cursos.filter(ativo=True).values_list("id", flat=True)
    )


def filtrar_cursos_queryset(qs, usuario):
    """Filtra queryset de cursos pelas tags do plano do usuário."""
    tag_ids = tag_ids_do_plano_ativo(usuario)
    if tag_ids is None:
        return qs
    if not tag_ids:
        return qs.none()
    return qs.filter(tags__id__in=tag_ids).distinct()


def curso_visivel_para_usuario(usuario, curso):
    """Gestão, matrícula existente ou curso com tag permitida pelo plano."""
    if usuario_pode_gestao(usuario):
        return True
    from apps.cursos.models import Matricula

    if Matricula.objects.filter(usuario=usuario, curso=curso).exists():
        return True
    tag_ids = tag_ids_do_plano_ativo(usuario)
    if not tag_ids:
        return False
    return curso.tags.filter(id__in=tag_ids).exists()


def validar_token_resgate(token, usuario):
    """Retorna lista de erros (vazia = ok)."""
    erros = []
    if not token:
        erros.append("Token inválido.")
        return erros
    if not token.ativo:
        erros.append("Este token foi desativado.")
    if not token.plano.ativo:
        erros.append("O plano deste token não está mais disponível.")
    if token.usos_realizados >= token.max_usos:
        erros.append("Este token atingiu o limite de usos.")
    agora = timezone.now()
    if token.valido_ate_resgate and agora > token.valido_ate_resgate:
        erros.append("Este token expirou e não pode mais ser resgatado.")
    if token.tipo_expiracao == TokenPlano.TIPO_DATA_FIXA:
        if not token.data_fim:
            erros.append("Token mal configurado (sem data de fim).")
        elif agora > token.data_fim:
            erros.append("O período deste token já encerrou.")
    if token.tipo_expiracao == TokenPlano.TIPO_DURACAO:
        if not token.duracao_dias:
            erros.append("Token mal configurado (sem duração).")
    if assinatura_ativa(usuario):
        erros.append("Você já possui um plano ativo.")
    return erros


def calcular_expira_em(token):
    """Calcula data de expiração da assinatura ao resgatar."""
    agora = timezone.now()
    if token.tipo_expiracao == TokenPlano.TIPO_DATA_FIXA:
        return token.data_fim
    return agora + timedelta(days=token.duracao_dias)


@transaction.atomic
def resgatar_token(chave, usuario):
    """Resgata token e cria assinatura. Levanta ValueError com mensagem."""
    chave_limpa = chave.strip().upper()
    try:
        token = TokenPlano.objects.select_for_update().select_related("plano").get(
            chave__iexact=chave_limpa
        )
    except TokenPlano.DoesNotExist:
        raise ValueError("Token inválido ou não encontrado.")

    erros = validar_token_resgate(token, usuario)
    if erros:
        raise ValueError(erros[0])

    expira_em = calcular_expira_em(token)
    assinatura = AssinaturaUsuario.objects.create(
        usuario=usuario,
        plano=token.plano,
        token=token,
        expira_em=expira_em,
        status=AssinaturaUsuario.STATUS_ATIVA,
    )
    token.usos_realizados += 1
    token.save(update_fields=["usos_realizados"])
    return assinatura


def serializar_assinatura(assinatura):
    """Resumo da assinatura para API."""
    if not assinatura:
        return None
    agora = timezone.now()
    dias = max(0, (assinatura.expira_em - agora).days)
    tags = [
        {"id": t.id, "nome": t.nome, "slug": t.slug}
        for t in assinatura.plano.tags_cursos.filter(ativo=True)
    ]
    return {
        "id": assinatura.id,
        "plano_id": assinatura.plano_id,
        "plano_titulo": assinatura.plano.titulo,
        "plano_slug": assinatura.plano.slug,
        "ativado_em": assinatura.ativado_em.isoformat(),
        "expira_em": assinatura.expira_em.isoformat(),
        "status": assinatura.status,
        "dias_restantes": dias,
        "features": assinatura.plano.features_dict(),
        "tags_cursos": tags,
    }
