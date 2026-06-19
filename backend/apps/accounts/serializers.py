"""Serializers de autenticação e cadastro."""
from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado.")
        return email

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data["nome"].strip(),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name"]
