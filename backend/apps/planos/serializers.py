"""Serializers de planos e tokens."""
from rest_framework import serializers

from .models import AssinaturaUsuario, Plano, TokenPlano


class PlanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plano
        fields = [
            "id", "titulo", "slug", "descricao", "ativo",
            "acesso_cursos", "acesso_trilhas", "acesso_biblioteca",
            "acesso_ao_vivo", "acesso_certificados", "acesso_ranking",
            "acesso_comunicados", "acesso_progresso", "criado_em",
        ]
        read_only_fields = ["id", "criado_em"]


class PlanoCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plano
        fields = ["id", "titulo", "slug", "descricao"]


class TokenPlanoSerializer(serializers.ModelSerializer):
    plano_titulo = serializers.CharField(source="plano.titulo", read_only=True)
    usos_restantes = serializers.SerializerMethodField()

    class Meta:
        model = TokenPlano
        fields = [
            "id", "chave", "plano", "plano_titulo", "max_usos", "usos_realizados",
            "usos_restantes", "tipo_expiracao", "data_fim", "duracao_dias",
            "valido_ate_resgate", "ativo", "criado_em",
        ]
        read_only_fields = ["id", "chave", "usos_realizados", "criado_em"]

    def get_usos_restantes(self, obj):
        return max(0, obj.max_usos - obj.usos_realizados)


class TokenPlanoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenPlano
        fields = [
            "plano", "max_usos", "tipo_expiracao", "data_fim",
            "duracao_dias", "valido_ate_resgate",
        ]

    def validate(self, data):
        tipo = data.get("tipo_expiracao", TokenPlano.TIPO_DURACAO)
        if tipo == TokenPlano.TIPO_DATA_FIXA and not data.get("data_fim"):
            raise serializers.ValidationError({"data_fim": "Informe a data de fim para expiração fixa."})
        if tipo == TokenPlano.TIPO_DURACAO and not data.get("duracao_dias"):
            raise serializers.ValidationError({"duracao_dias": "Informe a duração em dias."})
        if data.get("max_usos", 1) < 1:
            raise serializers.ValidationError({"max_usos": "Mínimo 1 uso."})
        return data


class ResgatarTokenSerializer(serializers.Serializer):
    chave = serializers.CharField(max_length=32)


class AssinaturaUsoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source="usuario.first_name", read_only=True)
    usuario_email = serializers.CharField(source="usuario.email", read_only=True)

    class Meta:
        model = AssinaturaUsuario
        fields = ["id", "usuario_nome", "usuario_email", "ativado_em", "expira_em", "status"]
