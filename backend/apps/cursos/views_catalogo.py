"""API de catálogo, busca e trilhas para alunos."""
from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Curso, MaterialBiblioteca, Matricula, Trilha, TrilhaCurso
from .serializers_gestao import CursoGestaoListSerializer, TrilhaGestaoSerializer


class BuscaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response({"cursos": [], "trilhas": [], "biblioteca": []})

        cursos = Curso.objects.filter(
            status=Curso.STATUS_PUBLICADO
        ).filter(Q(titulo__icontains=q) | Q(descricao__icontains=q))[:8]
        trilhas = Trilha.objects.filter(
            Q(titulo__icontains=q) | Q(descricao__icontains=q)
        )[:5]
        pdfs = MaterialBiblioteca.objects.filter(
            publicado=True
        ).filter(Q(titulo__icontains=q) | Q(descricao__icontains=q))[:5]

        return Response({
            "cursos": [{"id": c.id, "titulo": c.titulo, "tipo": "curso"} for c in cursos],
            "trilhas": [{"id": t.id, "titulo": t.titulo, "tipo": "trilha"} for t in trilhas],
            "biblioteca": [
                {"id": p.id, "titulo": p.titulo, "tipo": "biblioteca", "url": p.arquivo_url}
                for p in pdfs
            ],
        })


class CatalogoCursosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Curso.objects.filter(status=Curso.STATUS_PUBLICADO).select_related("setor")
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


class TrilhasAlunoListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        trilhas = Trilha.objects.prefetch_related("itens__curso").select_related("setor")
        dados = []
        user = request.user
        for t in trilhas:
            itens = t.itens.filter(curso__status=Curso.STATUS_PUBLICADO)
            total = itens.count()
            concluidos = 0
            for item in itens:
                if Matricula.objects.filter(usuario=user, curso=item.curso, progresso=100).exists():
                    concluidos += 1
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            trilha = Trilha.objects.prefetch_related("itens__curso__setor").get(pk=pk)
        except Trilha.DoesNotExist:
            return Response({"detail": "Trilha não encontrada."}, status=404)

        cursos = []
        for item in trilha.itens.filter(curso__status=Curso.STATUS_PUBLICADO):
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
