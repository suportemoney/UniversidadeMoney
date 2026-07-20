"""Serializers de autenticação e cadastro."""
from django.contrib.auth.models import User
from rest_framework import serializers

from apps.cursos.permissions import usuario_pode_gestao
from apps.planos.services import assinatura_ativa, features_efetivas, serializar_assinatura

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
    pode_gestao = serializers.SerializerMethodField()
    tem_plano = serializers.SerializerMethodField()
    assinatura = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    precisa_redefinir_senha = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "cpf", "cargo", "setor",
            "is_superuser", "is_membro_equipe", "pode_gestao",
            "tem_plano", "assinatura", "features", "precisa_redefinir_senha",
        ]

    def get_cpf(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.cpf
        return None

    def get_precisa_redefinir_senha(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.precisa_redefinir_senha
        return False
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

    def get_pode_gestao(self, obj):
        return usuario_pode_gestao(obj)

    def get_tem_plano(self, obj):
        if usuario_pode_gestao(obj):
            return True
        return assinatura_ativa(obj) is not None

    def get_assinatura(self, obj):
        if usuario_pode_gestao(obj):
            return None
        return serializar_assinatura(assinatura_ativa(obj))

    def get_features(self, obj):
        return features_efetivas(obj)
