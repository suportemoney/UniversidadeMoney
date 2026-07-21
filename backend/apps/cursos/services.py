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
# Margem de avanço aceita por heartbeat (anti-seek)
MARGEM_WATCH_SEGUNDOS = 5.0
# Fração mínima assistida para considerar aula completa
LIMIAR_ASSISTIDO = 0.98


def duracao_efetiva_aula(aula, duracao_cliente=None):
    """Duração em segundos: metadado da aula ou reportada pelo player."""
    if aula.duracao_segundos and aula.duracao_segundos > 0:
        return float(aula.duracao_segundos)
    if duracao_cliente is not None:
        try:
            d = float(duracao_cliente)
            if d > 0:
                return d
        except (TypeError, ValueError):
            pass
    return 0.0


def percentual_assistido(segundos, duracao):
    if not duracao or duracao <= 0:
        return 0
    return min(100, int((float(segundos) / float(duracao)) * 100))


def aula_assistida_completa(progresso, aula, duracao_cliente=None):
    """True se progresso já concluído ou assistiu >= limiar da duração."""
    if progresso and progresso.concluida:
        return True
    duracao = duracao_efetiva_aula(aula, duracao_cliente)
    if duracao <= 0:
        return False
    segundos = float(progresso.segundos_assistidos) if progresso else 0.0
    return segundos >= duracao * LIMIAR_ASSISTIDO


def aulas_pendentes_video(matricula):
    """Lista de aulas do curso ainda não assistidas por completo."""
    curso = matricula.curso
    aulas = list(
        AulaVideo.objects.filter(modulo__curso=curso).order_by("modulo__ordem", "ordem", "id")
    )
    progresso_map = {
        p.aula_id: p
        for p in ProgressoAula.objects.filter(matricula=matricula, aula__in=aulas)
    }
    pendentes = []
    for aula in aulas:
        pa = progresso_map.get(aula.id)
        if not aula_assistida_completa(pa, aula):
            pendentes.append({"id": aula.id, "titulo": aula.titulo})
    return pendentes


def curso_videoaulas_completas(matricula):
    """True se todas as videoaulas do curso foram assistidas."""
    return len(aulas_pendentes_video(matricula)) == 0


def mapa_progresso_aulas(matricula, aulas=None):
    qs = ProgressoAula.objects.filter(matricula=matricula)
    if aulas is not None:
        qs = qs.filter(aula__in=aulas)
    return {p.aula_id: p for p in qs}


def aula_liberada_para(matricula, aula, progresso_map=None):
    """
    Sequência: a 1ª aula do curso está sempre liberada;
    a N só libera se a N-1 foi assistida por completo.
    """
    curso = matricula.curso
    aulas = list(
        AulaVideo.objects.filter(modulo__curso=curso).order_by("modulo__ordem", "ordem", "id")
    )
    if not aulas:
        return False
    ids = [a.id for a in aulas]
    if aula.id not in ids:
        return False
    idx = ids.index(aula.id)
    if idx == 0:
        return True
    if progresso_map is None:
        progresso_map = mapa_progresso_aulas(matricula, aulas)
    anterior = aulas[idx - 1]
    return aula_assistida_completa(progresso_map.get(anterior.id), anterior)


def liberacao_flags_aulas(matricula, aulas, progresso_map=None):
    """Retorna dict aula_id -> liberada (sequencial)."""
    if progresso_map is None:
        progresso_map = mapa_progresso_aulas(matricula, aulas)
    flags = {}
    anterior_ok = True
    for aula in aulas:
        flags[aula.id] = anterior_ok
        anterior_ok = aula_assistida_completa(progresso_map.get(aula.id), aula)
    return flags


def atividades_pendentes(matricula):
    """Atividades obrigatórias ainda sem tentativa."""
    curso = matricula.curso
    atividades = list(
        Atividade.objects.filter(modulo__curso=curso, obrigatoria=True).order_by(
            "modulo__ordem", "ordem", "id"
        )
    )
    pendentes = []
    for ativ in atividades:
        if not TentativaAtividade.objects.filter(matricula=matricula, atividade=ativ).exists():
            pendentes.append({"id": ativ.id, "titulo": ativ.titulo})
    return pendentes


def curso_atividades_completas(matricula):
    """True se não há atividade obrigatória pendente (ou não há atividades)."""
    return len(atividades_pendentes(matricula)) == 0


def atividade_liberada_para(matricula):
    """Atividade só após todas as videoaulas."""
    return curso_videoaulas_completas(matricula)


def prova_liberada_para(matricula):
    """Prova só após todas as videoaulas e todas as atividades obrigatórias."""
    return curso_videoaulas_completas(matricula) and curso_atividades_completas(matricula)


def registrar_progresso_aula(matricula, aula, posicao_atual, duracao_cliente=None):
    """
    Atualiza segundos_assistidos com avanço contínuo (anti-pulo).
    Retorna (progresso, criado_ou_atualizado_ok).
    """
    try:
        posicao = float(posicao_atual)
    except (TypeError, ValueError):
        posicao = 0.0
    if posicao < 0:
        posicao = 0.0

    duracao = duracao_efetiva_aula(aula, duracao_cliente)
    # Preenche duração no metadado se ainda zerada
    if (not aula.duracao_segundos or aula.duracao_segundos <= 0) and duracao > 0:
        aula.duracao_segundos = int(round(duracao))
        aula.save(update_fields=["duracao_segundos"])
        recalcular_curso(aula.modulo.curso)

    progresso, _ = ProgressoAula.objects.get_or_create(
        matricula=matricula,
        aula=aula,
        defaults={"segundos_assistidos": 0},
    )

    # Já concluída: permite qualquer posição (revisão)
    if progresso.concluida:
        return progresso, True

    atual = float(progresso.segundos_assistidos or 0)
    # Só aceita avanço se não pular além da margem
    if posicao > atual + MARGEM_WATCH_SEGUNDOS:
        return progresso, False

    novo = max(atual, posicao)
    if duracao > 0:
        novo = min(novo, duracao)

    campos = []
    if novo > atual:
        progresso.segundos_assistidos = novo
        campos.append("segundos_assistidos")

    if duracao > 0 and progresso.segundos_assistidos >= duracao * LIMIAR_ASSISTIDO:
        if not progresso.concluida:
            progresso.concluida = True
            progresso.concluida_em = timezone.now()
            campos.extend(["concluida", "concluida_em"])

    if campos:
        progresso.save(update_fields=campos)
        if progresso.concluida:
            calcular_progresso_matricula(matricula)

    return progresso, True


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
        # Atividade por módulo é opcional; se existir, precisa de questões
        ativ_qs = modulo.atividades.all()
        if ativ_qs.count() > 1:
            erros.append(
                f'Módulo "{modulo.titulo}": mantenha no máximo uma atividade avaliativa.'
            )
        elif ativ_qs.count() == 1 and not ativ_qs.first().questoes.exists():
            erros.append(
                f'Módulo "{modulo.titulo}": a atividade precisa de pelo menos uma questão.'
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
