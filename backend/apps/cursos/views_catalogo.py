"""API de catálogo, busca e trilhas para alunos."""
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planos.permissions import TemAcessoAluno, TemFeaturePlano
from apps.planos.services import (
    curso_visivel_para_usuario,
    filtrar_ao_vivo_queryset,
    filtrar_cursos_queryset,
    trilha_visivel_para_usuario,
)

from .models import Curso, InscricaoAoVivo, MaterialBiblioteca, Matricula, Modulo, Trilha, TreinamentoAoVivo
from .serializers_gestao import CursoGestaoListSerializer


class BuscaView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response({"cursos": [], "trilhas": [], "biblioteca": [], "ao_vivo": []})

        cursos_qs = Curso.objects.filter(
            status=Curso.STATUS_PUBLICADO
        ).filter(Q(titulo__icontains=q) | Q(descricao__icontains=q)).select_related("setor").prefetch_related("tags")
        cursos = filtrar_cursos_queryset(cursos_qs, request.user)[:12]
        trilhas_qs = Trilha.objects.filter(
            Q(titulo__icontains=q) | Q(descricao__icontains=q)
        ).prefetch_related("itens__curso__tags").select_related("setor")
        trilhas = [t for t in trilhas_qs if trilha_visivel_para_usuario(request.user, t)][:8]
        pdfs = MaterialBiblioteca.objects.filter(
            publicado=True
        ).filter(Q(titulo__icontains=q) | Q(descricao__icontains=q)).select_related("setor")[:8]
        hoje = timezone.now().date()
        ao_vivo_qs = TreinamentoAoVivo.objects.filter(
            data__gte=hoje
        ).filter(Q(titulo__icontains=q) | Q(descricao__icontains=q)).select_related("setor").prefetch_related("tags")
        ao_vivo = filtrar_ao_vivo_queryset(ao_vivo_qs, request.user)[:8]

        return Response({
            "q": q,
            "cursos": [
                {
                    "id": c.id,
                    "titulo": c.titulo,
                    "tipo": "curso",
                    "setor": c.setor.nome if c.setor else None,
                    "duracao_horas": float(c.duracao_horas),
                    "total_modulos": c.total_modulos,
                    "is_novo": c.is_novo,
                    "tags": [{"id": t.id, "nome": t.nome, "slug": t.slug} for t in c.tags.all()],
                }
                for c in cursos
            ],
            "trilhas": [
                {
                    "id": t.id,
                    "titulo": t.titulo,
                    "tipo": "trilha",
                    "setor": t.setor.nome if t.setor else None,
                }
                for t in trilhas
            ],
            "biblioteca": [
                {
                    "id": p.id,
                    "titulo": p.titulo,
                    "tipo": "biblioteca",
                    "setor": p.setor.nome if p.setor else None,
                    "url": p.arquivo_url,
                }
                for p in pdfs
            ],
            "ao_vivo": [
                {
                    "id": t.id,
                    "titulo": t.titulo,
                    "tipo": "ao_vivo",
                    "setor": t.setor.nome if t.setor else None,
                    "data": t.data.isoformat(),
                    "hora": t.hora.strftime("%H:%M"),
                }
                for t in ao_vivo
            ],
        })


class CatalogoCursosView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_cursos")]

    def get(self, request):
        qs = filtrar_cursos_queryset(
            Curso.objects.filter(status=Curso.STATUS_PUBLICADO).select_related("setor").prefetch_related("tags"),
            request.user,
        )
        setor = request.query_params.get("setor")
        q = request.query_params.get("q", "").strip()
        is_novo = request.query_params.get("is_novo")
        if setor:
            qs = qs.filter(setor_id=setor)
        if q:
            qs = qs.filter(Q(titulo__icontains=q) | Q(descricao__icontains=q))
        if is_novo == "1":
            qs = qs.filter(is_novo=True)
        return Response(CursoGestaoListSerializer(qs, many=True).data)


class CatalogoCursoDetailView(APIView):
    """Detalhe público de um curso para matrícula individual (sem trilha)."""
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_cursos")]

    def get(self, request, pk):
        try:
            curso = Curso.objects.prefetch_related("modulos__aulas", "tags").select_related("setor").get(
                pk=pk, status=Curso.STATUS_PUBLICADO
            )
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Curso não encontrado."}, status=404)

        matricula = Matricula.objects.filter(usuario=request.user, curso=curso).first()
        modulos = [
            {
                "id": m.id,
                "titulo": m.titulo,
                "total_aulas": m.aulas.count(),
                "duracao_minutos": m.duracao_minutos,
            }
            for m in curso.modulos.all()
        ]
        trilhas = [
            {"id": t.id, "titulo": t.titulo}
            for t in Trilha.objects.filter(itens__curso=curso).distinct()
        ]

        return Response({
            "id": curso.id,
            "titulo": curso.titulo,
            "descricao": curso.descricao,
            "setor": curso.setor.nome if curso.setor else None,
            "total_modulos": curso.total_modulos,
            "duracao_horas": float(curso.duracao_horas),
            "is_novo": curso.is_novo,
            "thumbnail_url": curso.thumbnail.url if curso.thumbnail else None,
            "modulos": modulos,
            "trilhas": trilhas,
            "matriculado": bool(matricula),
            "progresso": matricula.progresso if matricula else 0,
            "tags": [{"id": t.id, "nome": t.nome, "slug": t.slug} for t in curso.tags.all()],
        })


class TrilhasAlunoListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_trilhas")]

    def get(self, request):
        trilhas = Trilha.objects.prefetch_related("itens__curso__tags").select_related("setor")
        dados = []
        user = request.user
        for t in trilhas:
            if not trilha_visivel_para_usuario(user, t):
                continue
            itens = list(t.itens.filter(curso__status=Curso.STATUS_PUBLICADO).select_related("curso"))
            total = len(itens)
            concluidos = sum(
                1 for item in itens
                if Matricula.objects.filter(usuario=user, curso=item.curso, progresso=100).exists()
            )
            progresso = int((concluidos / total) * 100) if total else 0
            dados.append({
                "id": t.id,
                "titulo": t.titulo,
                "descricao": t.descricao,
                "setor": t.setor.nome if t.setor else None,
                "total_cursos": total,
                "progresso": progresso,
            })
        return Response(dados)


class TrilhaAlunoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_trilhas")]

    def get(self, request, pk):
        try:
            trilha = Trilha.objects.prefetch_related("itens__curso__setor").get(pk=pk)
        except Trilha.DoesNotExist:
            return Response({"detail": "Trilha não encontrada."}, status=404)

        if not trilha_visivel_para_usuario(request.user, trilha):
            return Response({"detail": "Trilha não encontrada."}, status=404)

        cursos = []
        for item in trilha.itens.filter(curso__status=Curso.STATUS_PUBLICADO).select_related("curso"):
            m = Matricula.objects.filter(usuario=request.user, curso=item.curso).first()
            cursos.append({
                "id": item.curso.id,
                "titulo": item.curso.titulo,
                "ordem": item.ordem,
                "progresso": m.progresso if m else 0,
                "matriculado": bool(m),
            })
        return Response({
            "id": trilha.id,
            "titulo": trilha.titulo,
            "descricao": trilha.descricao,
            "cursos": cursos,
        })
