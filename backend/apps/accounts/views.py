"""Views de autenticação."""
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import MeUpdateSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """Cadastro de novo usuário (nome, e-mail, senha)."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Conta criada com sucesso."},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Retorna e atualiza dados do usuário autenticado."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = MeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "first_name" in data:
            user.first_name = data["first_name"]
            user.save(update_fields=["first_name"])
        if "cargo" in data and hasattr(user, "profile"):
            user.profile.cargo = data["cargo"]
            user.profile.save(update_fields=["cargo"])
        return Response(UserSerializer(user).data)
