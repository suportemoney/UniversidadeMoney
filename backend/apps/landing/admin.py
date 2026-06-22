from django.contrib import admin

from .models import BannerLanding, FaixaPromocional


@admin.register(FaixaPromocional)
class FaixaPromocionalAdmin(admin.ModelAdmin):
    list_display = ["mensagem", "ativo", "exibir_countdown", "atualizado_em"]


@admin.register(BannerLanding)
class BannerLandingAdmin(admin.ModelAdmin):
    list_display = ["titulo", "ordem", "ativo", "criado_em"]
