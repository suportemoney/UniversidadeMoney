"""Utilitários de gestão de cursos."""
from decimal import Decimal

from django.utils import timezone

from .models import AulaVideo, Certificado, Conquista, Curso, Matricula, Modulo, ProgressoAula


def recalcular_curso(curso):
    """Atualiza total de módulos e duração com base nas aulas."""
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
    """Validações mínimas para publicação."""
    erros = []
    if not curso.titulo.strip():
        erros.append("Informe o título do curso.")
    modulos = curso.modulos.all()
    if not modulos.exists():
        erros.append("Adicione pelo menos um módulo.")
    total_aulas = AulaVideo.objects.filter(modulo__curso=curso).count()
    if total_aulas == 0:
        erros.append("Adicione pelo menos uma aula em vídeo.")
    return erros


def calcular_progresso_matricula(matricula):
    """Calcula progresso percentual da matrícula."""
    curso = matricula.curso
    aulas = AulaVideo.objects.filter(modulo__curso=curso, obrigatoria=True)
    total = aulas.count()
    if total == 0:
        return matricula.progresso

    concluidas = ProgressoAula.objects.filter(
        matricula=matricula, aula__in=aulas, concluida=True
    ).count()
    progresso = int((concluidas / total) * 100)
    matricula.progresso = min(progresso, 99)
    matricula.save(update_fields=["progresso", "atualizado_em"])
    return matricula.progresso


def concluir_curso(matricula):
    """Marca curso concluído e emite certificado."""
    matricula.progresso = 100
    matricula.concluido_em = timezone.now()
    matricula.save(update_fields=["progresso", "concluido_em", "atualizado_em"])
    Certificado.objects.get_or_create(usuario=matricula.usuario, curso=matricula.curso)
    emitir_conquista(matricula.usuario, "primeiro-curso", "Primeiro Curso")
    emitir_conquista(matricula.usuario, "especialista", "Especialista")


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
