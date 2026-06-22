"""Views da API de gestão de planos e tokens."""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cursos.permissions import IsGestor

from .models import AssinaturaUsuario, Plano, TokenPlano
from .serializers import (
    AssinaturaUsoSerializer,
    PlanoSerializer,
    TokenPlanoCreateSerializer,
    TokenPlanoSerializer,
)


class GestaoPlanosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    queryset = Plano.objects.prefetch_related("tags_cursos").all()
    serializer_class = PlanoSerializer


class GestaoPlanoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    queryset = Plano.objects.prefetch_related("tags_cursos").all()
    serializer_class = PlanoSerializer


class GestaoTokensListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TokenPlanoCreateSerializer
        return TokenPlanoSerializer

    def get_queryset(self):
        return TokenPlano.objects.select_related("plano", "criado_por").all()

    def create(self, request, *args, **kwargs):
        serializer = TokenPlanoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.save(criado_por=request.user)
        return Response(TokenPlanoSerializer(token).data, status=status.HTTP_201_CREATED)


class GestaoTokenDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsGestor]
    queryset = TokenPlano.objects.select_related("plano")
    serializer_class = TokenPlanoSerializer

    def patch(self, request, *args, **kwargs):
        token = self.get_object()
        ativo = request.data.get("ativo")
        if ativo is not None:
            token.ativo = bool(ativo)
            token.save(update_fields=["ativo"])
        return Response(TokenPlanoSerializer(token).data)


class GestaoTokenUsosView(APIView):
    permission_classes = [IsGestor]

    def get(self, request, pk):
        try:
            token = TokenPlano.objects.get(pk=pk)
        except TokenPlano.DoesNotExist:
            return Response({"detail": "Token não encontrado."}, status=404)
        usos = AssinaturaUsuario.objects.filter(token=token).select_related("usuario")
        return Response(AssinaturaUsoSerializer(usos, many=True).data)
