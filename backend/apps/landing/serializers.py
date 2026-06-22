"""Serializers da landing."""
from rest_framework import serializers

from apps.planos.models import Plano

from .models import BannerLanding, FaixaPromocional

MODULOS_PADRAO = ["Biblioteca", "Certificados", "Comunicados", "Progresso"]

MODULOS_RESTRITOS = {
    "acesso_cursos": "Cursos",
    "acesso_trilhas": "Trilhas",
    "acesso_ao_vivo": "Ao vivo",
}


def modulos_do_plano(plano):
    """Lista de módulos incluídos no plano para exibição na landing."""
    modulos = []
    for campo, label in MODULOS_RESTRITOS.items():
        if getattr(plano, campo, False):
            modulos.append(label)
    modulos.extend(MODULOS_PADRAO)
    return modulos


class FaixaPromocionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaixaPromocional
        fields = [
            "id", "mensagem", "texto_botao", "url_botao",
            "exibir_countdown", "data_fim_countdown", "ativo", "atualizado_em",
        ]
        read_only_fields = ["id", "atualizado_em"]


class FaixaPromocionalPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaixaPromocional
        fields = [
            "mensagem", "texto_botao", "url_botao",
            "exibir_countdown", "data_fim_countdown",
        ]


class BannerLandingSerializer(serializers.ModelSerializer):
    imagem_url = serializers.SerializerMethodField()

    class Meta:
        model = BannerLanding
        fields = [
            "id", "titulo", "subtitulo", "link", "imagem_url",
            "ordem", "ativo", "criado_em",
        ]
        read_only_fields = ["id", "imagem_url", "criado_em"]

    def get_imagem_url(self, obj):
        return obj.imagem_url


class BannerLandingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BannerLanding
        fields = ["id", "titulo", "subtitulo", "link", "ordem", "ativo"]
        read_only_fields = ["id"]


class BannerLandingPublicSerializer(serializers.ModelSerializer):
    imagem_url = serializers.SerializerMethodField()

    class Meta:
        model = BannerLanding
        fields = ["id", "titulo", "subtitulo", "link", "imagem_url", "ordem"]

    def get_imagem_url(self, obj):
        return obj.imagem_url


class PlanoLandingSerializer(serializers.Serializer):
    """Plano ativo para exibição pública na landing."""

    id = serializers.IntegerField()
    titulo = serializers.CharField()
    slug = serializers.CharField()
    descricao = serializers.CharField()
    modulos = serializers.ListField(child=serializers.CharField())

    @staticmethod
    def from_plano(plano):
        return {
            "id": plano.id,
            "titulo": plano.titulo,
            "slug": plano.slug,
            "descricao": plano.descricao,
            "modulos": modulos_do_plano(plano),
        }

    @staticmethod
    def listar_ativos():
        planos = Plano.objects.filter(ativo=True).order_by("titulo")
        return [PlanoLandingSerializer.from_plano(p) for p in planos]
