"""Views da API do aluno — player e progresso."""
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions_api import IsFrontendJwtOrApiKey

from apps.planos.permissions import TemAcessoAluno
from apps.planos.services import curso_visivel_para_usuario

from .models import (
    Atividade,
    AulaVideo,
    Certificado,
    Curso,
    CursoMaterial,
    Matricula,
    ProgressoAula,
    ProvaFinal,
    TentativaAtividade,
    TentativaProva,
)
from .serializers_gestao import AulaVideoSerializer, CursoGestaoDetailSerializer, CursoMaterialSerializer
from .services import (
    atividade_liberada_para,
    aulas_pendentes_video,
    atividades_pendentes,
    avaliar_e_emitir_certificado,
    aula_assistida_completa,
    aula_liberada_para,
    calcular_progresso_matricula,
    corrigir_questoes,
    duracao_efetiva_aula,
    emitir_conquista,
    liberacao_flags_aulas,
    percentual_assistido,
    prova_liberada_para,
    registrar_progresso_aula,
    resumo_notas_matricula,
)


class MeusCursosView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def get(self, request):
        matriculas = Matricula.objects.filter(usuario=request.user).select_related("curso", "curso__setor")
        dados = [
            {
                "matricula_id": m.id,
                "curso_id": m.curso.id,
                "titulo": m.curso.titulo,
                "progresso": m.progresso,
                "setor": m.curso.setor.nome if m.curso.setor else None,
                "concluido": m.certificado_liberado or m.progresso >= 100,
                "nota_final": m.nota_final,
                "certificado_liberado": m.certificado_liberado,
            }
            for m in matriculas.order_by("-atualizado_em")
        ]
        return Response(dados)


class CursoAlunoDetailView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def get(self, request, curso_id):
        try:
            curso = Curso.objects.prefetch_related(
                "modulos__aulas",
                "modulos__atividades",
                "materiais",
                "participantes",
            ).select_related("instrutor", "prova_final").get(pk=curso_id, status=Curso.STATUS_PUBLICADO)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        progresso_map = {
            pa.aula_id: pa
            for pa in ProgressoAula.objects.filter(matricula=matricula)
        }

        materiais = CursoMaterialSerializer(curso.materiais.all(), many=True).data

        todas_aulas = list(
            AulaVideo.objects.filter(modulo__curso=curso).order_by("modulo__ordem", "ordem", "id")
        )
        liberacao = liberacao_flags_aulas(matricula, todas_aulas, progresso_map)
        ativ_ok = atividade_liberada_para(matricula)
        prova_ok = prova_liberada_para(matricula)
        pendentes_ativ = atividades_pendentes(matricula)

        modulos = []
        for modulo in curso.modulos.all():
            item = {
                "id": modulo.id,
                "titulo": modulo.titulo,
                "tipo": "video",
                "aulas": [],
                "atividade": None,
            }
            for aula in modulo.aulas.all():
                aula_data = AulaVideoSerializer(aula).data
                pa = progresso_map.get(aula.id)
                segundos = float(pa.segundos_assistidos) if pa else 0.0
                duracao = duracao_efetiva_aula(aula)
                concluida = bool(pa and pa.concluida)
                aula_data["concluida"] = concluida
                aula_data["liberada"] = bool(liberacao.get(aula.id, False))
                aula_data["segundos_assistidos"] = segundos
                aula_data["percentual_assistido"] = (
                    100 if concluida else percentual_assistido(segundos, duracao)
                )
                item["aulas"].append(aula_data)

            ativ = modulo.atividades.first()
            if ativ:
                melhor = (
                    TentativaAtividade.objects.filter(matricula=matricula, atividade=ativ)
                    .order_by("-nota")
                    .first()
                )
                item["atividade"] = {
                    "id": ativ.id,
                    "titulo": ativ.titulo,
                    "tipo": ativ.tipo,
                    "obrigatoria": ativ.obrigatoria,
                    "nota": melhor.nota if melhor else None,
                    "concluida": melhor is not None,
                    "liberada": ativ_ok,
                }
            modulos.append(item)

        prova = None
        if hasattr(curso, "prova_final") and curso.prova_final:
            pf = curso.prova_final
            tentativas = TentativaProva.objects.filter(matricula=matricula, prova=pf).count()
            melhor_prova = (
                TentativaProva.objects.filter(matricula=matricula, prova=pf)
                .order_by("-nota")
                .first()
            )
            prova = {
                "id": pf.id,
                "titulo": pf.titulo,
                "nota_minima": pf.nota_minima,
                "tentativas_usadas": tentativas,
                "tentativas_max": pf.tentativas_max,
                "tempo_limite_min": pf.tempo_limite_min,
                "nota": melhor_prova.nota if melhor_prova else None,
                "aprovado": melhor_prova.aprovado if melhor_prova else False,
            }

        pendentes = aulas_pendentes_video(matricula)
        notas = resumo_notas_matricula(matricula)
        cert = Certificado.objects.filter(usuario=request.user, curso=curso).first()
        curso_data = CursoGestaoDetailSerializer(curso).data

        return Response(
            {
                "curso": curso_data,
                "matricula_id": matricula.id,
                "progresso": matricula.progresso,
                "descricao": curso.descricao,
                "materiais": materiais,
                "modulos": modulos,
                "prova_final": prova,
                "prova_liberada": prova_ok,
                "atividade_liberada": ativ_ok,
                "aulas_pendentes": pendentes,
                "atividades_pendentes": pendentes_ativ,
                "notas": notas,
                "certificado": bool(cert) or matricula.certificado_liberado,
                "certificado_id": cert.id if cert else None,
            }
        )


class ConcluirAulaView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def post(self, request, aula_id):
        try:
            aula = AulaVideo.objects.select_related("modulo__curso").get(pk=aula_id)
        except AulaVideo.DoesNotExist:
            return Response({"detail": "Aula não encontrada."}, status=404)

        curso = aula.modulo.curso
        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        progresso = ProgressoAula.objects.filter(matricula=matricula, aula=aula).first()
        if not aula_liberada_para(matricula, aula):
            return Response(
                {"detail": "Assista a videoaula anterior até o final para liberar esta aula."},
                status=403,
            )
        if not aula_assistida_completa(progresso, aula):
            return Response(
                {"detail": "Assista o vídeo até o final para concluir a aula."},
                status=400,
            )

        ProgressoAula.objects.update_or_create(
            matricula=matricula,
            aula=aula,
            defaults={"concluida": True, "concluida_em": timezone.now()},
        )
        progresso_pct = calcular_progresso_matricula(matricula)
        return Response({"progresso": progresso_pct, "concluida": True})


class ProgressoAulaView(APIView):
    """Heartbeat de watch — avança só para frente, conclui ao atingir limiar."""

    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def post(self, request, aula_id):
        try:
            aula = AulaVideo.objects.select_related("modulo__curso").get(pk=aula_id)
        except AulaVideo.DoesNotExist:
            return Response({"detail": "Aula não encontrada."}, status=404)

        curso = aula.modulo.curso
        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        if not aula_liberada_para(matricula, aula):
            return Response(
                {"detail": "Assista a videoaula anterior até o final para liberar esta aula."},
                status=403,
            )
        posicao = request.data.get("posicao_atual", 0)
        duracao = request.data.get("duracao")

        progresso, ok = registrar_progresso_aula(matricula, aula, posicao, duracao)
        duracao_eff = duracao_efetiva_aula(aula, duracao)
        return Response(
            {
                "ok": ok,
                "segundos_assistidos": float(progresso.segundos_assistidos or 0),
                "percentual_assistido": (
                    100
                    if progresso.concluida
                    else percentual_assistido(progresso.segundos_assistidos, duracao_eff)
                ),
                "concluida": progresso.concluida,
                "progresso_curso": matricula.progresso,
                "prova_liberada": prova_liberada_para(matricula),
                "atividade_liberada": atividade_liberada_para(matricula),
            }
        )


class AtividadeAlunoView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def get(self, request, atividade_id):
        try:
            atividade = Atividade.objects.prefetch_related("questoes").select_related(
                "modulo__curso"
            ).get(pk=atividade_id)
        except Atividade.DoesNotExist:
            return Response({"detail": "Atividade não encontrada."}, status=404)

        curso = atividade.modulo.curso
        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        if not atividade_liberada_para(matricula):
            return Response(
                {
                    "detail": "Assista todas as videoaulas antes da atividade.",
                    "aulas_pendentes": aulas_pendentes_video(matricula),
                },
                status=403,
            )

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
        if not curso_visivel_para_usuario(request.user, curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=curso)
        if not atividade_liberada_para(matricula):
            return Response(
                {
                    "detail": "Assista todas as videoaulas antes da atividade.",
                    "aulas_pendentes": aulas_pendentes_video(matricula),
                },
                status=403,
            )
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
        return Response({
            "nota": nota,
            "aprovado": aprovado,
            "tentativa_id": tentativa.id,
            "prova_liberada": prova_liberada_para(matricula),
        })


class ProvaAlunoView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, TemAcessoAluno]

    def get(self, request, prova_id):
        try:
            prova = ProvaFinal.objects.prefetch_related("questoes").select_related("curso").get(pk=prova_id)
        except ProvaFinal.DoesNotExist:
            return Response({"detail": "Prova não encontrada."}, status=404)

        if not curso_visivel_para_usuario(request.user, prova.curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=prova.curso)
        if not prova_liberada_para(matricula):
            return Response(
                {
                    "detail": "Assista todas as videoaulas e conclua as atividades antes da prova.",
                    "aulas_pendentes": aulas_pendentes_video(matricula),
                    "atividades_pendentes": atividades_pendentes(matricula),
                },
                status=403,
            )
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

        if not curso_visivel_para_usuario(request.user, prova.curso):
            return Response({"detail": "Este curso não está disponível no seu plano."}, status=403)

        matricula, _ = Matricula.objects.get_or_create(usuario=request.user, curso=prova.curso)
        if not prova_liberada_para(matricula):
            return Response(
                {
                    "detail": "Assista todas as videoaulas e conclua as atividades antes da prova.",
                    "aulas_pendentes": aulas_pendentes_video(matricula),
                    "atividades_pendentes": atividades_pendentes(matricula),
                },
                status=403,
            )
        tentativas = TentativaProva.objects.filter(matricula=matricula, prova=prova).count()
        if tentativas >= prova.tentativas_max:
            return Response({"detail": "Limite de tentativas atingido."}, status=400)

        questoes = list(prova.questoes.all())
        respostas = request.data.get("respostas", {})
        nota, _ = corrigir_questoes(questoes, respostas)

        TentativaProva.objects.create(
            matricula=matricula,
            prova=prova,
            nota=nota,
            aprovado=False,  # aprovação real depende da nota final composta
            respostas=respostas,
        )

        certificado = avaliar_e_emitir_certificado(matricula)
        matricula.refresh_from_db()
        notas = resumo_notas_matricula(matricula)

        if certificado:
            emitir_conquista(request.user, "prova-aprovada", "Prova Aprovada")

        return Response(
            {
                "nota": nota,
                "nota_prova": notas["nota_prova"],
                "media_atividades": notas["media_atividades"],
                "nota_final": notas["nota_final"],
                "aprovado": certificado,
                "certificado": certificado,
                "tentativa_id": TentativaProva.objects.filter(matricula=matricula, prova=prova)
                .order_by("-id")
                .values_list("id", flat=True)
                .first(),
            }
        )
