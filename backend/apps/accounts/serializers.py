"""Serializers de autenticação e cadastro."""
from django.contrib.auth.models import User
from rest_framework import serializers

from apps.cursos.permissions import (
    escopo_cursos_apenas,
    nivel_do_usuario,
    pode_api,
    pode_convites,
    pode_equipe,
    pode_excluir,
    precisa_mfa_painel,
    usuario_pode_gestao,
)
from apps.planos.services import features_efetivas

from .models import Profile
from .validators import cpf_valido, normalizar_cpf


class RegisterSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    cpf = serializers.CharField(max_length=14)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def validate_cpf(self, value):
        cpf = normalizar_cpf(value)
        if not cpf_valido(cpf):
            raise serializers.ValidationError("CPF inválido.")
        if Profile.objects.filter(cpf=cpf).exists():
            raise serializers.ValidationError("Este CPF já está cadastrado.")
        return cpf

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data["nome"].strip(),
        )
        Profile.objects.create(
            user=user,
            cpf=validated_data["cpf"],
            precisa_redefinir_senha=False,
        )
        return user


class MeUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    cpf = serializers.SerializerMethodField()
    cargo = serializers.SerializerMethodField()
    setor = serializers.SerializerMethodField()
    is_membro_equipe = serializers.SerializerMethodField()
    nivel_acesso = serializers.SerializerMethodField()
    pode_gestao = serializers.SerializerMethodField()
    pode_api = serializers.SerializerMethodField()
    pode_convites = serializers.SerializerMethodField()
    pode_equipe = serializers.SerializerMethodField()
    pode_excluir = serializers.SerializerMethodField()
    escopo_cursos_apenas = serializers.SerializerMethodField()
    tem_plano = serializers.SerializerMethodField()
    assinatura = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    precisa_redefinir_senha = serializers.SerializerMethodField()
    totp_confirmado = serializers.SerializerMethodField()
    precisa_mfa_painel = serializers.SerializerMethodField()
    mfa_ok = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "cpf", "cargo", "setor",
            "is_superuser", "is_membro_equipe", "nivel_acesso",
            "pode_gestao", "pode_api", "pode_convites", "pode_equipe",
            "pode_excluir", "escopo_cursos_apenas",
            "tem_plano", "assinatura", "features", "precisa_redefinir_senha",
            "totp_confirmado", "precisa_mfa_painel", "mfa_ok",
        ]

    def get_cpf(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.cpf
        return None

    def get_precisa_redefinir_senha(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.precisa_redefinir_senha
        return False

    def get_totp_confirmado(self, obj):
        if hasattr(obj, "profile"):
            return bool(obj.profile.totp_confirmado)
        return False

    def get_precisa_mfa_painel(self, obj):
        return precisa_mfa_painel(obj)

    def get_mfa_ok(self, obj):
        # Claim do JWT atual (via context da MeView)
        return bool(self.context.get("mfa_ok"))

    def get_cargo(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.cargo
        return "Colaborador"

    def get_setor(self, obj):
        if hasattr(obj, "profile") and obj.profile.setor:
            return obj.profile.setor.nome
        return None

    def get_is_membro_equipe(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.is_membro_equipe
        return False

    def get_nivel_acesso(self, obj):
        return nivel_do_usuario(obj)

    def get_pode_gestao(self, obj):
        return usuario_pode_gestao(obj)

    def get_pode_api(self, obj):
        return pode_api(obj)

    def get_pode_convites(self, obj):
        return pode_convites(obj)

    def get_pode_equipe(self, obj):
        return pode_equipe(obj)

    def get_pode_excluir(self, obj):
        return pode_excluir(obj)

    def get_escopo_cursos_apenas(self, obj):
        return escopo_cursos_apenas(obj)

    def get_tem_plano(self, obj):
        # LMS interno: autenticado = acesso (campo mantido por compatibilidade da API)
        return bool(obj and obj.is_active)

    def get_assinatura(self, obj):
        return None

    def get_features(self, obj):
        return features_efetivas(obj)
