from django.contrib import admin

from .models import (
    Certificado,
    Comunicado,
    Conquista,
    Curso,
    Matricula,
    Modulo,
    Setor,
    TreinamentoAoVivo,
    Trilha,
)


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = ["nome", "slug", "ordem"]
    prepopulated_fields = {"slug": ("nome",)}


@admin.register(Trilha)
class TrilhaAdmin(admin.ModelAdmin):
    list_display = ["titulo", "setor"]
    list_filter = ["setor"]


class ModuloInline(admin.TabularInline):
    model = Modulo
    extra = 0


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "setor", "duracao_horas", "is_novo", "publicado"]
    list_filter = ["setor", "is_novo", "publicado"]
    inlines = [ModuloInline]


@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ["usuario", "curso", "progresso", "atualizado_em"]
    list_filter = ["curso__setor"]


@admin.register(TreinamentoAoVivo)
class TreinamentoAoVivoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "data", "hora", "setor"]
    list_filter = ["setor"]


@admin.register(Comunicado)
class ComunicadoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "tipo", "criado_em"]


@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ["usuario", "curso", "emitido_em"]


@admin.register(Conquista)
class ConquistaAdmin(admin.ModelAdmin):
    list_display = ["usuario", "titulo", "slug", "emitido_em"]
