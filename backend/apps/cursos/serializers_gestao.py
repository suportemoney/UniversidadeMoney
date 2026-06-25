"""Serializers da API de gestão."""
from django.contrib.auth.models import User
from rest_framework import serializers

from apps.accounts.models import Profile
from .models import (
    Atividade,
    AulaVideo,
    Comunicado,
    Curso,
    CursoParticipante,
    MaterialBiblioteca,
    Modulo,
    ModuloArquivo,
    ProvaFinal,
    Questao,
    Setor,
    TagCurso,
    TreinamentoAoVivo,
    Trilha,
    TrilhaCurso,
)


class SetorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setor
        fields = ["id", "nome", "slug", "icone", "ordem"]
        read_only_fields = ["id"]


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
        read_only_fields = ["id", "video_url", "modulo", "ordem"]

    def get_video_url(self, obj):
        return obj.video_url


class AtividadeSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = Atividade
        fields = ["id", "modulo", "titulo", "tipo", "ordem", "obrigatoria", "questoes"]
        read_only_fields = ["id", "modulo", "ordem"]


class ModuloArquivoSerializer(serializers.ModelSerializer):
    arquivo_url = serializers.SerializerMethodField()

    class Meta:
        model = ModuloArquivo
        fields = ["id", "modulo", "titulo", "tipo", "arquivo", "arquivo_url", "ordem"]
        read_only_fields = ["id", "arquivo_url", "modulo", "ordem"]

    def get_arquivo_url(self, obj):
        return obj.arquivo_url


class ModuloSerializer(serializers.ModelSerializer):
    aulas = AulaVideoSerializer(many=True, read_only=True)
    atividades = AtividadeSerializer(many=True, read_only=True)
    arquivos = ModuloArquivoSerializer(many=True, read_only=True)

    class Meta:
        model = Modulo
        fields = [
            "id", "curso", "titulo", "tipo", "conteudo_texto", "ordem",
            "duracao_minutos", "aulas", "atividades", "arquivos",
        ]
        read_only_fields = ["id", "duracao_minutos", "curso", "ordem"]

    def validate(self, attrs):
        if self.instance and "tipo" in attrs and attrs["tipo"] != self.instance.tipo:
            raise serializers.ValidationError({"tipo": "O tipo do módulo não pode ser alterado após a criação."})
        return attrs


class CursoParticipanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CursoParticipante
        fields = ["id", "curso", "nome", "cargo", "ordem"]
        read_only_fields = ["id", "curso", "ordem"]


class ProvaFinalSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = ProvaFinal
        fields = ["id", "curso", "titulo", "nota_minima", "tentativas_max", "tempo_limite_min", "questoes"]
        read_only_fields = ["id"]


class TagCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagCurso
        fields = ["id", "nome", "slug", "ativo", "criado_em"]
        read_only_fields = ["id", "criado_em"]


class CursoGestaoListSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    criado_por_nome = serializers.CharField(source="criado_por.first_name", read_only=True, default=None)
    tags = TagCursoSerializer(many=True, read_only=True)

    class Meta:
        model = Curso
        fields = [
            "id", "titulo", "status", "setor", "setor_nome", "total_modulos",
            "duracao_horas", "is_novo", "criado_em", "atualizado_em", "criado_por_nome", "tags",
        ]


class CursoGestaoDetailSerializer(serializers.ModelSerializer):
    modulos = ModuloSerializer(many=True, read_only=True)
    prova_final = ProvaFinalSerializer(read_only=True)
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    instrutor_nome = serializers.CharField(source="instrutor.first_name", read_only=True, default=None)
    thumbnail_url = serializers.SerializerMethodField()
    tags = TagCursoSerializer(many=True, read_only=True)
    participantes = CursoParticipanteSerializer(many=True, read_only=True)

    class Meta:
        model = Curso
        fields = [
            "id", "titulo", "descricao", "status", "setor", "setor_nome",
            "instrutor", "instrutor_nome", "participantes",
            "total_modulos", "duracao_horas", "is_novo", "thumbnail", "thumbnail_url",
            "criado_em", "atualizado_em", "modulos", "prova_final", "tags",
        ]
        read_only_fields = ["id", "total_modulos", "duracao_horas", "criado_em", "atualizado_em"]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None


class CursoGestaoWriteSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=TagCurso.objects.filter(ativo=True), required=False
    )

    class Meta:
        model = Curso
        fields = ["titulo", "descricao", "setor", "is_novo", "status", "tags", "instrutor"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        validated_data.setdefault("status", Curso.STATUS_RASCUNHO)
        validated_data["criado_por"] = self.context["request"].user
        curso = super().create(validated_data)
        if tags:
            curso.tags.set(tags)
        return curso

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        curso = super().update(instance, validated_data)
        if tags is not None:
            curso.tags.set(tags)
        return curso


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
    setor = serializers.SerializerMethodField()
    setor_nome = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "cpf", "cargo", "setor", "setor_nome",
            "is_membro_equipe", "is_superuser",
        ]

    def get_cpf(self, obj):
        return getattr(getattr(obj, "profile", None), "cpf", None)

    def get_is_membro_equipe(self, obj):
        return getattr(getattr(obj, "profile", None), "is_membro_equipe", False)

    def get_cargo(self, obj):
        return getattr(getattr(obj, "profile", None), "cargo", "Colaborador")

    def get_setor(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.setor_id if profile and profile.setor_id else None

    def get_setor_nome(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.setor.nome if profile and profile.setor else None


class UsuarioEquipeCreateSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    cpf = serializers.CharField(max_length=14)
    password = serializers.CharField(min_length=8, write_only=True)
    cargo = serializers.CharField(max_length=100, required=False, default="Colaborador")
    setor = serializers.IntegerField(required=False, allow_null=True)
    is_membro_equipe = serializers.BooleanField(default=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def validate_cpf(self, value):
        from apps.accounts.validators import cpf_valido, normalizar_cpf

        cpf = normalizar_cpf(value)
        if not cpf_valido(cpf):
            raise serializers.ValidationError("CPF inválido.")
        if Profile.objects.filter(cpf=cpf).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return cpf

    def validate_setor(self, value):
        if value is None:
            return None
        if not Setor.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Setor inválido.")
        return value

    def create(self, validated_data):
        email = validated_data["email"].strip().lower()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data["nome"].strip(),
        )
        Profile.objects.create(
            user=user,
            cpf=validated_data["cpf"],
            cargo=validated_data.get("cargo") or "Colaborador",
            setor_id=validated_data.get("setor"),
            is_membro_equipe=validated_data.get("is_membro_equipe", True),
        )
        return User.objects.select_related("profile", "profile__setor").get(pk=user.pk)


class UsuarioEquipeUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    setor = serializers.IntegerField(required=False, allow_null=True)
    is_membro_equipe = serializers.BooleanField(required=False)

    def validate_setor(self, value):
        if value is None:
            return None
        if not Setor.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Setor inválido.")
        return value

    def update(self, instance, validated_data):
        if instance.is_superuser:
            raise serializers.ValidationError("Não é possível alterar superuser.")

        if "first_name" in validated_data:
            instance.first_name = validated_data["first_name"].strip()
            instance.save(update_fields=["first_name"])

        profile = instance.profile
        campos = []
        if "cargo" in validated_data:
            profile.cargo = validated_data["cargo"] or "Colaborador"
            campos.append("cargo")
        if "setor" in validated_data:
            profile.setor_id = validated_data["setor"]
            campos.append("setor")
        if "is_membro_equipe" in validated_data:
            profile.is_membro_equipe = validated_data["is_membro_equipe"]
            campos.append("is_membro_equipe")
        if campos:
            profile.save(update_fields=campos)

        return User.objects.select_related("profile", "profile__setor").get(pk=instance.pk)


class ComunicadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comunicado
        fields = ["id", "titulo", "conteudo", "tipo", "criado_em"]
        read_only_fields = ["id", "criado_em"]


class TreinamentoAoVivoSerializer(serializers.ModelSerializer):
    setor_nome = serializers.CharField(source="setor.nome", read_only=True, default=None)
    tags = TagCursoSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=TagCurso.objects.filter(ativo=True), source="tags", required=False
    )

    class Meta:
        model = TreinamentoAoVivo
        fields = [
            "id", "titulo", "data", "hora", "setor", "setor_nome", "descricao",
            "tipo_plataforma", "link", "tags", "tag_ids",
        ]

    def validate(self, data):
        link = data.get("link")
        if link is None and self.instance:
            link = self.instance.link
        if not link:
            raise serializers.ValidationError(
                {"link": "Informe o link do Google Meet ou do YouTube Live."}
            )
        return data

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        obj = super().create(validated_data)
        if tags:
            obj.tags.set(tags)
        return obj

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        obj = super().update(instance, validated_data)
        if tags is not None:
            obj.tags.set(tags)
        return obj


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
