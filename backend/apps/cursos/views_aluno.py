"""Views da API do aluno — player e progresso."""
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.planos.permissions import TemAcessoAluno

from .models import (
    Atividade,
    AulaVideo,
    Certificado,
    Curso,
    Matricula,
    ProgressoAula,
    ProvaFinal,
    Questao,
    TentativaAtividade,
    TentativaProva,
)
from .serializers_gestao import AulaVideoSerializer, CursoGestaoDetailSerializer
from .services import calcular_progresso_matricula, concluir_curso, corrigir_questoes, emitir_conquista


class MeusCursosView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request):
        matriculas = Matricula.objects.filter(usuario=request.user).select_related("curso", "curso__setor")
        dados = [
            {
                "matricula_id": m.id,
                "curso_id": m.curso.id,
                "titulo": m.curso.titulo,
                "progresso": m.progresso,
                "setor": m.curso.setor.nome if m.curso.setor else None,
                "concluido": m.progresso >= 100,
            }
            for m in matriculas.order_by("-atualizado_em")
        ]
        return Response(dados)


class CursoAlunoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request, curso_id):
        try:
            curso = Curso.objects.prefetch_related(
                "modulos__aulas", "modulos__atividades"
            ).get(pk=curso_id, status=Curso.STATUS_PUBLICADO)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        progresso_aulas = {
            pa.aula_id: pa.concluida
            for pa in ProgressoAula.objects.filter(matricula=matricula)
        }

        modulos = []
        for modulo in curso.modulos.all():
            aulas = []
            for aula in modulo.aulas.all():
                item = AulaVideoSerializer(aula).data
                item["concluida"] = progresso_aulas.get(aula.id, False)
                aulas.append(item)
            atividades = [
                {"id": a.id, "titulo": a.titulo, "tipo": a.tipo, "obrigatoria": a.obrigatoria}
                for a in modulo.atividades.all()
            ]
            modulos.append({"id": modulo.id, "titulo": modulo.titulo, "aulas": aulas, "atividades": atividades})

        prova = None
        if hasattr(curso, "prova_final"):
            pf = curso.prova_final
            tentativas = TentativaProva.objects.filter(matricula=matricula, prova=pf).count()
            prova = {
                "id": pf.id,
                "titulo": pf.titulo,
                "nota_minima": pf.nota_minima,
                "tentativas_usadas": tentativas,
                "tentativas_max": pf.tentativas_max,
                "tempo_limite_min": pf.tempo_limite_min,
                "aprovado": TentativaProva.objects.filter(
                    matricula=matricula, prova=pf, aprovado=True
                ).exists(),
            }

        certificado = Certificado.objects.filter(usuario=request.user, curso=curso).exists()

        return Response(
            {
                "curso": CursoGestaoDetailSerializer(curso).data,
                "matricula_id": matricula.id,
                "progresso": matricula.progresso,
                "modulos": modulos,
                "prova_final": prova,
                "certificado": certificado,
            }
        )


class ConcluirAulaView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def post(self, request, aula_id):
        try:
            aula = AulaVideo.objects.select_related("modulo__curso").get(pk=aula_id)
        except AulaVideo.DoesNotExist:
            return Response({"detail": "Aula não encontrada."}, status=404)

        curso = aula.modulo.curso
        if curso.status != Curso.STATUS_PUBLICADO:
            return Response({"detail": "Curso indisponível."}, status=400)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        pa, _ = ProgressoAula.objects.get_or_create(matricula=matricula, aula=aula)
        if not pa.concluida:
            pa.concluida = True
            pa.concluida_em = timezone.now()
            pa.save()

        progresso = calcular_progresso_matricula(matricula)
        return Response({"progresso": progresso, "concluida": True})


class AtividadeAlunoView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request, atividade_id):
        try:
            atividade = Atividade.objects.prefetch_related("questoes").select_related(
                "modulo__curso"
            ).get(pk=atividade_id)
        except Atividade.DoesNotExist:
            return Response({"detail": "Atividade não encontrada."}, status=404)

        questoes = [
            {"id": q.id, "enunciado": q.enunciado, "tipo": q.tipo, "opcoes": q.opcoes, "ordem": q.ordem}
            for q in atividade.questoes.all()
        ]
        return Response({"id": atividade.id, "titulo": atividade.titulo, "tipo": atividade.tipo, "questoes": questoes})

    def post(self, request, atividade_id):
        try:
            atividade = Atividade.objects.prefetch_related("questoes").select_related(
                "modulo__curso"
            ).get(pk=atividade_id)
        except Atividade.DoesNotExist:
            return Response({"detail": "Atividade não encontrada."}, status=404)

        curso = atividade.modulo.curso
        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        questoes = list(atividade.questoes.all())
        respostas = request.data.get("respostas", {})
        nota, _ = corrigir_questoes(questoes, respostas)
        aprovado = nota >= 70

        tentativa = TentativaAtividade.objects.create(
            matricula=matricula,
            atividade=atividade,
            nota=nota,
            aprovado=aprovado,
            respostas=respostas,
        )
        calcular_progresso_matricula(matricula)
        return Response({"nota": nota, "aprovado": aprovado, "tentativa_id": tentativa.id})


class ProvaAlunoView(APIView):
    permission_classes = [permissions.IsAuthenticated, TemAcessoAluno]

    def get(self, request, prova_id):
        try:
            prova = ProvaFinal.objects.prefetch_related("questoes").select_related("curso").get(pk=prova_id)
        except ProvaFinal.DoesNotExist:
            return Response({"detail": "Prova não encontrada."}, status=404)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=prova.curso)
        tentativas = TentativaProva.objects.filter(matricula=matricula, prova=prova).count()
        if tentativas >= prova.tentativas_max:
            return Response({"detail": "Limite de tentativas atingido."}, status=400)

        questoes = [
            {"id": q.id, "enunciado": q.enunciado, "tipo": q.tipo, "opcoes": q.opcoes, "ordem": q.ordem}
            for q in prova.questoes.all()
        ]
        return Response(
            {
                "id": prova.id,
                "titulo": prova.titulo,
                "nota_minima": prova.nota_minima,
                "tentativas_restantes": prova.tentativas_max - tentativas,
                "tempo_limite_min": prova.tempo_limite_min,
                "questoes": questoes,
            }
        )

    def post(self, request, prova_id):
        try:
            prova = ProvaFinal.objects.prefetch_related("questoes").select_related("curso").get(pk=prova_id)
        except ProvaFinal.DoesNotExist:
            return Response({"detail": "Prova não encontrada."}, status=404)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=prova.curso)
        tentativas = TentativaProva.objects.filter(matricula=matricula, prova=prova).count()
        if tentativas >= prova.tentativas_max:
            return Response({"detail": "Limite de tentativas atingido."}, status=400)

        questoes = list(prova.questoes.all())
        respostas = request.data.get("respostas", {})
        nota, _ = corrigir_questoes(questoes, respostas)
        aprovado = nota >= prova.nota_minima

        tentativa = TentativaProva.objects.create(
            matricula=matricula,
            prova=prova,
            nota=nota,
            aprovado=aprovado,
            respostas=respostas,
        )

        if aprovado:
            concluir_curso(matricula)
            emitir_conquista(request.user, "prova-aprovada", "Prova Aprovada")
        else:
            calcular_progresso_matricula(matricula)

        return Response(
            {
                "nota": nota,
                "aprovado": aprovado,
                "certificado": aprovado,
                "tentativa_id": tentativa.id,
            }
        )
