"""Serializers de autenticação e cadastro."""
from django.contrib.auth.models import User
from rest_framework import serializers

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
        Profile.objects.create(user=user, cpf=validated_data["cpf"])
        return user


class UserSerializer(serializers.ModelSerializer):
    cpf = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "cpf"]

    def get_cpf(self, obj):
        if hasattr(obj, "profile"):
            return obj.profile.cpf
        return None
