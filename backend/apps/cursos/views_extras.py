"""APIs extras — certificados, progresso, comunicados, ao-vivo, biblioteca."""
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planos.permissions import TemAcessoAluno, TemFeaturePlano
from apps.planos.services import ao_vivo_visivel_para_usuario, filtrar_ao_vivo_queryset

from .models import (
    Certificado,
    Comunicado,
    ComunicadoLeitura,
    Conquista,
    InscricaoAoVivo,
    Matricula,
    MaterialBiblioteca,
    TreinamentoAoVivo,
)
from .services import calcular_horas_usuario, emitir_conquista


class CertificadosListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        certs = Certificado.objects.filter(usuario=request.user).select_related("curso")
        return Response([
            {
                "id": c.id,
                "curso_id": c.curso.id,
                "curso_titulo": c.curso.titulo,
                "emitido_em": c.emitido_em.isoformat(),
            }
            for c in certs
        ])


class CertificadoDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request, pk):
        try:
            cert = Certificado.objects.select_related("curso", "usuario").get(
                pk=pk, usuario=request.user
            )
        except Certificado.DoesNotExist:
            return Response({"detail": "Certificado não encontrado."}, status=404)

        texto = (
            f"Certificado de Conclusao\n\n"
            f"Certificamos que {cert.usuario.first_name}\n"
            f"concluiu o curso: {cert.curso.titulo}\n"
            f"Data: {cert.emitido_em.strftime('%d/%m/%Y')}\n\n"
            f"Money Promotora - Universidade Money"
        )
        response = HttpResponse(texto, content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="certificado-{cert.id}.txt"'
        return response


class ProgressoView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        user = request.user
        matriculas = Matricula.objects.filter(usuario=user).select_related("curso", "curso__setor")
        em_andamento = matriculas.filter(progresso__lt=100).count()
        concluidos = matriculas.filter(progresso=100).count()
        horas = calcular_horas_usuario(user)

        por_setor = {}
        for m in matriculas:
            nome = m.curso.setor.nome if m.curso.setor else "Geral"
            if nome not in por_setor:
                por_setor[nome] = {"total": 0, "concluidos": 0, "horas": 0.0}
            por_setor[nome]["total"] += 1
            if m.progresso >= 100:
                por_setor[nome]["concluidos"] += 1
            por_setor[nome]["horas"] += float(m.curso.duracao_horas) * (m.progresso / 100)

        if horas >= 10:
            emitir_conquista(user, "10-horas", "10 Horas de Treinamento")

        return Response({
            "horas_totais": horas,
            "em_andamento": em_andamento,
            "concluidos": concluidos,
            "certificados": Certificado.objects.filter(usuario=user).count(),
            "por_setor": [
                {"setor": k, **v} for k, v in por_setor.items()
            ],
        })


class ComunicadosListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        tipo = request.query_params.get("tipo")
        qs = Comunicado.objects.all()
        if tipo:
            qs = qs.filter(tipo=tipo)
        lidos = set(
            ComunicadoLeitura.objects.filter(usuario=request.user).values_list("comunicado_id", flat=True)
        )
        return Response([
            {
                "id": c.id,
                "titulo": c.titulo,
                "conteudo": c.conteudo,
                "tipo": c.tipo,
                "criado_em": c.criado_em.isoformat(),
                "lido": c.id in lidos,
            }
            for c in qs[:50]
        ])


class ComunicadosNaoLidosView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        lidos = ComunicadoLeitura.objects.filter(usuario=request.user).values_list("comunicado_id", flat=True)
        count = Comunicado.objects.exclude(id__in=lidos).count()
        recentes = Comunicado.objects.exclude(id__in=lidos).order_by("-criado_em")[:5]
        return Response({
            "count": count,
            "itens": [
                {"id": c.id, "titulo": c.titulo, "tipo": c.tipo, "criado_em": c.criado_em.isoformat()}
                for c in recentes
            ],
        })


class ComunicadoMarcarLidoView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def post(self, request, pk):
        try:
            com = Comunicado.objects.get(pk=pk)
        except Comunicado.DoesNotExist:
            return Response({"detail": "Não encontrado."}, status=404)
        ComunicadoLeitura.objects.get_or_create(usuario=request.user, comunicado=com)
        return Response({"ok": True})


class AoVivoListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_ao_vivo")]

    def get(self, request):
        hoje = timezone.now().date()
        inscritos = set(
            InscricaoAoVivo.objects.filter(usuario=request.user).values_list("treinamento_id", flat=True)
        )
        treinos = filtrar_ao_vivo_queryset(
            TreinamentoAoVivo.objects.filter(data__gte=hoje).select_related("setor").prefetch_related("tags"),
            request.user,
        )
        return Response([
            {
                "id": t.id,
                "titulo": t.titulo,
                "data": t.data.isoformat(),
                "hora": t.hora.strftime("%H:%M"),
                "setor": t.setor.nome if t.setor else None,
                "descricao": t.descricao,
                "inscrito": t.id in inscritos,
            }
            for t in treinos
        ])


class AoVivoInscreverView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno, TemFeaturePlano("acesso_ao_vivo")]

    def post(self, request, pk):
        try:
            t = TreinamentoAoVivo.objects.prefetch_related("tags").get(pk=pk)
        except TreinamentoAoVivo.DoesNotExist:
            return Response({"detail": "Treinamento não encontrado."}, status=404)
        if not ao_vivo_visivel_para_usuario(request.user, t):
            return Response({"detail": "Treinamento não disponível no seu plano."}, status=403)
        InscricaoAoVivo.objects.get_or_create(usuario=request.user, treinamento=t)
        return Response({"inscrito": True, "titulo": t.titulo})


class BibliotecaListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        setor = request.query_params.get("setor")
        qs = MaterialBiblioteca.objects.filter(publicado=True).select_related("setor")
        if setor:
            qs = qs.filter(setor_id=setor)
        return Response([
            {
                "id": m.id,
                "titulo": m.titulo,
                "descricao": m.descricao,
                "setor": m.setor.nome if m.setor else None,
                "arquivo_url": m.arquivo_url,
                "criado_em": m.criado_em.isoformat(),
            }
            for m in qs
        ])


class ConquistasListView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        conquistas = list(
            Conquista.objects.filter(usuario=request.user).values("slug", "titulo", "emitido_em")
        )
        if not conquistas:
            emitir_conquista(request.user, "boas-vindas", "Boas-vindas")
            conquistas = list(
                Conquista.objects.filter(usuario=request.user).values("slug", "titulo", "emitido_em")
            )
        for c in conquistas:
            if c["emitido_em"]:
                c["emitido_em"] = c["emitido_em"].isoformat()
        return Response(conquistas)
