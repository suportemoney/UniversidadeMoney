from django.contrib import admin

from .models import (
    Atividade,
    AulaVideo,
    Certificado,
    Comunicado,
    Conquista,
    Curso,
    Matricula,
    Modulo,
    ProgressoAula,
    ProvaFinal,
    Questao,
    Setor,
    TentativaAtividade,
    TentativaProva,
    TreinamentoAoVivo,
    Trilha,
    TrilhaCurso,
)


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ["nome", "slug", "ordem"]


class TrilhaCursoInline(admin.TabularInline):
    model = TrilhaCurso
    extra = 0


@admin.register(Trilha)
class TrilhaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "setor"]
    inlines = [TrilhaCursoInline]


class ModuloInline(admin.TabularInline):
    model = Modulo
    extra = 0


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "status", "setor", "duracao_horas", "is_novo"]
    list_filter = ["status", "setor", "is_novo"]
    inlines = [ModuloInline]


@admin.register(AulaVideo)
class AulaVideoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "modulo", "ordem", "duracao_segundos"]


@admin.register(Atividade)
class AtividadeAdmin(admin.ModelAdmin):
    list_display = ["titulo", "modulo", "tipo"]


@admin.register(Questao)
class QuestaoAdmin(admin.ModelAdmin):
    list_display = ["enunciado", "tipo", "atividade", "prova"]


@admin.register(ProvaFinal)
class ProvaFinalAdmin(admin.ModelAdmin):
    list_display = ["titulo", "curso", "nota_minima"]


@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ["usuario", "curso", "progresso"]


@admin.register(TreinamentoAoVivo)
class TreinamentoAoVivoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "data", "hora", "setor"]


@admin.register(Comunicado)
class ComunicadoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "tipo", "criado_em"]


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ["usuario", "curso", "emitido_em"]


@admin.register(Conquista)
class ConquistaAdmin(admin.ModelAdmin):
    list_display = ["usuario", "titulo", "slug"]


@admin.register(ProgressoAula)
class ProgressoAulaAdmin(admin.ModelAdmin):
    list_display = ["matricula", "aula", "concluida"]


@admin.register(TentativaProva)
class TentativaProvaAdmin(admin.ModelAdmin):
    list_display = ["matricula", "prova", "nota", "aprovado"]
