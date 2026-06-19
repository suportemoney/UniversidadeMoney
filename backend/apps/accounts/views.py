"""Views de autenticação."""
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import RegisterSerializer, UserSerializer


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


class MeView(generics.RetrieveAPIView):
    """Retorna dados do usuário autenticado."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
