"""Utilitários de gestão de cursos."""
from decimal import Decimal

from django.utils import timezone

from .models import (
    Atividade,
    AulaVideo,
    Certificado,
    Conquista,
    Curso,
    Matricula,
    Modulo,
    ProgressoAula,
    ProvaFinal,
    TentativaAtividade,
    TentativaProva,
)


NOTA_MINIMA_CERTIFICADO = 70


def recalcular_curso(curso):
    """Atualiza total de módulos e duração com base nas aulas em vídeo."""
    modulos = Modulo.objects.filter(curso=curso)
    total_modulos = modulos.count()
    segundos = 0
    for modulo in modulos:
        min_mod = sum(a.duracao_segundos for a in modulo.aulas.all())
        modulo.duracao_minutos = max(1, min_mod // 60) if min_mod else 0
        modulo.save(update_fields=["duracao_minutos"])
        segundos += min_mod

    curso.total_modulos = total_modulos
    curso.duracao_horas = Decimal(str(round(segundos / 3600, 1)))
    curso.save(update_fields=["total_modulos", "duracao_horas", "atualizado_em"])


def curso_pronto_publicar(curso):
    """Validações mínimas para publicação (estrutura nova)."""
    erros = []
    if not curso.titulo.strip():
        erros.append("Informe o título do curso.")
    if not (curso.descricao or "").strip():
        erros.append("Informe a descrição do curso.")
    if not curso.instrutor_id:
        erros.append("Selecione o instrutor do curso.")

    modulos = list(curso.modulos.all())
    if not modulos:
        erros.append("Adicione pelo menos um módulo.")

    for modulo in modulos:
        if not modulo.aulas.exists():
            erros.append(f'Módulo "{modulo.titulo}": adicione pelo menos uma videoaula.')
        for aula in modulo.aulas.all():
            if not aula.video:
                erros.append(f'Módulo "{modulo.titulo}": a aula "{aula.titulo}" precisa de vídeo.')
        if modulo.atividades.count() != 1:
            erros.append(
                f'Módulo "{modulo.titulo}": é obrigatória exatamente uma atividade avaliativa final.'
            )
        else:
            ativ = modulo.atividades.first()
            if not ativ.questoes.exists():
                erros.append(
                    f'Módulo "{modulo.titulo}": a atividade final precisa de pelo menos uma questão.'
                )

    try:
        prova = curso.prova_final
    except ProvaFinal.DoesNotExist:
        prova = None
    if not prova or not prova.questoes.exists():
        erros.append("Adicione a prova final com pelo menos uma questão.")

    return erros


def calcular_progresso_matricula(matricula):
    """Calcula progresso percentual da matrícula (aulas + atividades)."""
    curso = matricula.curso
    total = 0
    concluidas = 0

    aulas_obrigatorias = AulaVideo.objects.filter(modulo__curso=curso, obrigatoria=True)
    total += aulas_obrigatorias.count()
    concluidas += ProgressoAula.objects.filter(
        matricula=matricula, aula__in=aulas_obrigatorias, concluida=True
    ).count()

    atividades = Atividade.objects.filter(modulo__curso=curso, obrigatoria=True)
    total += atividades.count()
    for ativ in atividades:
        if TentativaAtividade.objects.filter(matricula=matricula, atividade=ativ).exists():
            concluidas += 1

    if hasattr(curso, "prova_final"):
        total += 1
        if TentativaProva.objects.filter(matricula=matricula, prova=curso.prova_final).exists():
            concluidas += 1

    if total == 0:
        return matricula.progresso

    progresso = int((concluidas / total) * 100)
    # Mantém abaixo de 100 até certificado liberado
    if not matricula.certificado_liberado:
        progresso = min(progresso, 99)
    else:
        progresso = 100
    matricula.progresso = progresso
    matricula.save(update_fields=["progresso", "atualizado_em"])
    return matricula.progresso


def calcular_nota_final(matricula):
    """
    (melhor_nota_prova + média das melhores notas por atividade) / 2.
    Sem atividades: média = 0. Sem prova: retorna None.
    """
    curso = matricula.curso
    try:
        prova = curso.prova_final
    except ProvaFinal.DoesNotExist:
        return None

    melhor_prova = (
        TentativaProva.objects.filter(matricula=matricula, prova=prova)
        .order_by("-nota")
        .values_list("nota", flat=True)
        .first()
    )
    if melhor_prova is None:
        return None

    atividades = list(Atividade.objects.filter(modulo__curso=curso))
    if not atividades:
        media_atividades = 0
    else:
        notas = []
        for ativ in atividades:
            melhor = (
                TentativaAtividade.objects.filter(matricula=matricula, atividade=ativ)
                .order_by("-nota")
                .values_list("nota", flat=True)
                .first()
            )
            notas.append(melhor if melhor is not None else 0)
        media_atividades = sum(notas) / len(notas)

    return int(round((melhor_prova + media_atividades) / 2))


def resumo_notas_matricula(matricula):
    """Retorna dict com nota_prova, media_atividades, nota_final e flags."""
    curso = matricula.curso
    nota_prova = None
    try:
        prova = curso.prova_final
        nota_prova = (
            TentativaProva.objects.filter(matricula=matricula, prova=prova)
            .order_by("-nota")
            .values_list("nota", flat=True)
            .first()
        )
    except ProvaFinal.DoesNotExist:
        pass

    atividades = list(Atividade.objects.filter(modulo__curso=curso))
    if not atividades:
        media_atividades = 0.0
    else:
        notas = []
        for ativ in atividades:
            melhor = (
                TentativaAtividade.objects.filter(matricula=matricula, atividade=ativ)
                .order_by("-nota")
                .values_list("nota", flat=True)
                .first()
            )
            notas.append(melhor if melhor is not None else 0)
        media_atividades = round(sum(notas) / len(notas), 1)

    nota_final = calcular_nota_final(matricula)
    return {
        "nota_prova": nota_prova,
        "media_atividades": media_atividades,
        "nota_final": nota_final,
        "certificado_liberado": matricula.certificado_liberado,
        "nota_minima": NOTA_MINIMA_CERTIFICADO,
    }


def avaliar_e_emitir_certificado(matricula):
    """
    Calcula nota final e, se >= 70, libera certificado e conclui o curso.
    Deve ser chamado após envio da prova (quando há nota de prova).
    """
    nota = calcular_nota_final(matricula)
    if nota is None:
        return False

    matricula.nota_final = nota
    if nota >= NOTA_MINIMA_CERTIFICADO:
        matricula.certificado_liberado = True
        matricula.progresso = 100
        matricula.concluido_em = matricula.concluido_em or timezone.now()
        matricula.save(
            update_fields=[
                "nota_final",
                "certificado_liberado",
                "progresso",
                "concluido_em",
                "atualizado_em",
            ]
        )
        Certificado.objects.get_or_create(usuario=matricula.usuario, curso=matricula.curso)
        emitir_conquista(matricula.usuario, "primeiro-curso", "Primeiro Curso")
        emitir_conquista(matricula.usuario, "especialista", "Especialista")
        emitir_conquista(matricula.usuario, "prova-aprovada", "Prova Aprovada")
        return True

    matricula.certificado_liberado = False
    matricula.save(update_fields=["nota_final", "certificado_liberado", "atualizado_em"])
    calcular_progresso_matricula(matricula)
    return False


def concluir_curso(matricula):
    """Marca curso concluído (sem emitir certificado — use avaliar_e_emitir_certificado)."""
    matricula.progresso = 100
    matricula.concluido_em = timezone.now()
    matricula.save(update_fields=["progresso", "concluido_em", "atualizado_em"])


def emitir_conquista(usuario, slug, titulo):
    """Emite conquista se ainda não existir."""
    Conquista.objects.get_or_create(usuario=usuario, slug=slug, defaults={"titulo": titulo})


def calcular_horas_usuario(usuario):
    """Total de horas de treinamento do usuário."""
    horas = 0.0
    for m in Matricula.objects.filter(usuario=usuario).select_related("curso"):
        horas += float(m.curso.duracao_horas) * (m.progresso / 100)
    return round(horas, 1)


def corrigir_questoes(questoes, respostas):
    """Retorna nota 0-100 e dict de acertos por questão."""
    if not questoes:
        return 0, {}
    acertos = 0
    detalhes = {}
    for q in questoes:
        rid = str(q.id)
        enviada = respostas.get(rid)
        correta = q.resposta_correta
        ok = enviada == correta.get("valor") if isinstance(correta, dict) else enviada == correta
        if ok:
            acertos += 1
        detalhes[rid] = ok
    nota = int((acertos / len(questoes)) * 100)
    return nota, detalhes
