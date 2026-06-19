"""Serializers da API de gestão."""
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Atividade,
    AulaVideo,
    Comunicado,
    Curso,
    MaterialBiblioteca,
    Modulo,
    ProvaFinal,
    Questao,
    Setor,
    TreinamentoAoVivo,
    Trilha,
    TrilhaCurso,
)


class SetorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = ["id", "nome", "slug", "icone"]


class QuestaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questao
        fields = ["id", "enunciado", "tipo", "opcoes", "resposta_correta", "ordem", "atividade", "prova"]
        read_only_fields = ["id"]


class AulaVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = AulaVideo
        fields = [
            "id", "modulo", "titulo", "descricao", "video", "video_url",
            "duracao_segundos", "ordem", "obrigatoria",
        ]
        read_only_fields = ["id", "video_url"]

    def get_video_url(self, obj):
        return obj.video_url


class AtividadeSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = Atividade
        fields = ["id", "modulo", "titulo", "tipo", "ordem", "obrigatoria", "questoes"]
        read_only_fields = ["id"]


class ModuloSerializer(serializers.ModelSerializer):
    aulas = AulaVideoSerializer(many=True, read_only=True)
    atividades = AtividadeSerializer(many=True, read_only=True)

    class Meta:
        model = Modulo
        fields = ["id", "curso", "titulo", "ordem", "duracao_minutos", "aulas", "atividades"]
        read_only_fields = ["id", "duracao_minutos"]


class ProvaFinalSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = ProvaFinal
        fields = ["id", "curso", "titulo", "nota_minima", "tentativas_max", "tempo_limite_min", "questoes"]
        read_only_fields = ["id"]


class CursoGestaoListSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    criado_por_nome = serializers.CharField(source="criado_por.first_name", read_only=True, default=None)

    class Meta:
        model = Curso
        fields = [
            "id", "titulo", "status", "setor", "setor_nome", "total_modulos",
            "duracao_horas", "is_novo", "criado_em", "atualizado_em", "criado_por_nome",
        ]


class CursoGestaoDetailSerializer(serializers.ModelSerializer):
    modulos = ModuloSerializer(many=True, read_only=True)
    prova_final = ProvaFinalSerializer(read_only=True)
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Curso
        fields = [
            "id", "titulo", "descricao", "status", "setor", "setor_nome",
            "total_modulos", "duracao_horas", "is_novo", "thumbnail", "thumbnail_url",
            "criado_em", "atualizado_em", "modulos", "prova_final",
        ]
        read_only_fields = ["id", "total_modulos", "duracao_horas", "criado_em", "atualizado_em"]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None


class CursoGestaoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ["titulo", "descricao", "setor", "is_novo", "status"]

    def create(self, validated_data):
        validated_data.setdefault("status", Curso.STATUS_RASCUNHO)
        validated_data["criado_por"] = self.context["request"].user
        return super().create(validated_data)


class TrilhaCursoItemSerializer(serializers.ModelSerializer):
    curso_titulo = serializers.CharField(source="curso.titulo", read_only=True)
    curso_status = serializers.CharField(source="curso.status", read_only=True)

    class Meta:
        model = TrilhaCurso
        fields = ["id", "curso", "curso_titulo", "curso_status", "ordem"]


class TrilhaGestaoSerializer(serializers.ModelSerializer):
    itens = TrilhaCursoItemSerializer(many=True, read_only=True)
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)

    class Meta:
        model = Trilha
        fields = ["id", "titulo", "descricao", "setor", "setor_nome", "itens"]


class TrilhaGestaoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trilha
        fields = ["titulo", "descricao", "setor"]


class UsuarioEquipeSerializer(serializers.ModelSerializer):
    cpf = serializers.SerializerMethodField()
    is_membro_equipe = serializers.SerializerMethodField()
    cargo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "cpf", "cargo", "is_membro_equipe", "is_superuser"]

    def get_cpf(self, obj):
        return getattr(getattr(obj, "profile", None), "cpf", None)

    def get_is_membro_equipe(self, obj):
        return getattr(getattr(obj, "profile", None), "is_membro_equipe", False)

    def get_cargo(self, obj):
        return getattr(getattr(obj, "profile", None), "cargo", "Colaborador")


class ComunicadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comunicado
        fields = ["id", "titulo", "conteudo", "tipo", "criado_em"]
        read_only_fields = ["id", "criado_em"]


class TreinamentoAoVivoSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)

    class Meta:
        model = TreinamentoAoVivo
        fields = ["id", "titulo", "data", "hora", "setor", "setor_nome", "descricao"]


class MaterialBibliotecaSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = MaterialBiblioteca
        fields = [
            "id", "titulo", "descricao", "setor", "setor_nome",
            "publicado", "arquivo_url", "criado_em",
        ]
        read_only_fields = ["id", "arquivo_url", "criado_em"]

    def get_arquivo_url(self, obj):
        return obj.arquivo_url
