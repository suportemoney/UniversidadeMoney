"""Views e serviços da API de cursos."""
from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planos.permissions import TemAcessoAluno, TemFeaturePlano
from apps.planos.services import curso_visivel_para_usuario, filtrar_ao_vivo_queryset, filtrar_cursos_queryset

from .models import (
    Certificado,
    Comunicado,
    Conquista,
    Curso,
    Matricula,
    Setor,
    TreinamentoAoVivo,
)
from .services import emitir_conquista


class DashboardView(APIView):
    """Agrega dados do painel principal do colaborador."""

    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)

        matriculas = Matricula.objects.filter(usuario=user).select_related("curso", "curso__setor")
        em_andamento = matriculas.filter(progresso__lt=100).count()
        certificados_count = Certificado.objects.filter(usuario=user).count()

        horas = 0.0
        for m in matriculas:
            horas += float(m.curso.duracao_horas) * (m.progresso / 100)

        cursos_publicados = filtrar_cursos_queryset(
            Curso.objects.filter(status=Curso.STATUS_PUBLICADO),
            user,
        )
        total_cursos = cursos_publicados.count()
        novos_semana = cursos_publicados.filter(
            criado_em__gte=timezone.now() - timedelta(days=7),
        ).count()

        continue_aprendendo = [
            {
                "id": m.curso.id,
                "titulo": m.curso.titulo,
                "progresso": m.progresso,
                "setor": m.curso.setor.nome if m.curso.setor else None,
            }
            for m in matriculas.filter(progresso__lt=100).order_by("-atualizado_em")[:6]
        ]

        if not continue_aprendendo:
            for curso in cursos_publicados.select_related("setor")[:4]:
                continue_aprendendo.append(
                    {
                        "id": curso.id,
                        "titulo": curso.titulo,
                        "progresso": 0,
                        "setor": curso.setor.nome if curso.setor else None,
                    }
                )

        trilhas_setor = []
        for setor in Setor.objects.all():
            total = cursos_publicados.filter(setor=setor).count()
            concluidos = Matricula.objects.filter(
                usuario=user, curso__setor=setor, progresso=100
            ).count()
            progresso = int((concluidos / total) * 100) if total else 0
            trilhas_setor.append(
                {
                    "slug": setor.slug,
                    "nome": setor.nome,
                    "icone": setor.icone,
                    "total_cursos": total,
                    "progresso": progresso,
                }
            )

        novos_treinamentos = [
            {
                "id": c.id,
                "titulo": c.titulo,
                "modulos": c.total_modulos,
                "duracao_horas": float(c.duracao_horas),
                "is_novo": c.is_novo,
            }
            for c in cursos_publicados.filter(is_novo=True)[:4]
        ]

        ao_vivo_qs = TreinamentoAoVivo.objects.filter(
            data__gte=timezone.now().date()
        ).select_related("setor").prefetch_related("tags")
        ao_vivo = [
            {
                "id": t.id,
                "titulo": t.titulo,
                "data": t.data.isoformat(),
                "hora": t.hora.strftime("%H:%M"),
                "setor": t.setor.nome if t.setor else None,
                "tipo_plataforma": t.tipo_plataforma,
                "link": t.link,
            }
            for t in filtrar_ao_vivo_queryset(ao_vivo_qs, user)[:4]
        ]

        comunicados = [
            {
                "id": c.id,
                "titulo": c.titulo,
                "conteudo": c.conteudo,
                "tipo": c.tipo,
                "criado_em": c.criado_em.isoformat(),
            }
            for c in Comunicado.objects.all()[:5]
        ]

        return Response(
            {
                "usuario": {
                    "nome": user.first_name,
                    "email": user.email,
                    "cargo": profile.cargo if profile else "Colaborador",
                    "setor": profile.setor.nome if profile and profile.setor else None,
                },
                "stats": {
                    "cursos_disponiveis": total_cursos,
                    "cursos_novos_semana": novos_semana,
                    "em_andamento": em_andamento,
                    "certificados": certificados_count,
                    "horas_treinamento": round(horas, 1),
                    "colaboradores_ativos": User.objects.filter(is_active=True).count(),
                },
                "continue_aprendendo": continue_aprendendo,
                "trilhas_setor": trilhas_setor,
                "novos_treinamentos": novos_treinamentos,
                "treinamentos_ao_vivo": ao_vivo,
                "comunicados": comunicados,
                "conquistas": self._conquistas(user),
                "total_certificados": certificados_count,
            }
        )

    def _conquistas(self, user):
        emitir_conquista(user, "boas-vindas", "Boas-vindas")
        return list(Conquista.objects.filter(usuario=user).values("slug", "titulo", "emitido_em"))


class MatricularView(APIView):
    """Matricula o usuário em um curso."""

    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_cursos")]

    def post(self, request, curso_id):
        try:
            curso = Curso.objects.get(pk=curso_id, status=Curso.STATUS_PUBLICADO)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, created = Matricula.objects.get_or_create(
            usuario=request.user,
            curso=curso,
            defaults={"progresso": 5},
        )
        if not created and matricula.progresso == 0:
            matricula.progresso = 5
            matricula.save(update_fields=["progresso", "atualizado_em"])

        return Response(
            {
                "id": matricula.id,
                "curso_id": curso.id,
                "progresso": matricula.progresso,
                "criado": created,
            }
        )
