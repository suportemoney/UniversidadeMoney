"""API de gestão da landing."""
import os
from apps.accounts.permissions_api import IsFrontendJwtOrApiKey

from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cursos.permissions import EscopoNaoSomenteCursos, IsGestor, PodeExcluir

from .models import BannerLanding, FaixaPromocional
from .serializers import (
    BannerLandingSerializer,
    BannerLandingWriteSerializer,
    FaixaPromocionalSerializer,
)

GIF_MAX_MB = int(os.getenv("GIF_MAX_MB", "15"))
GIF_EXT = {".gif"}


class GestaoFaixaPromocionalView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]

    def _obter_ou_criar_faixa(self):
        faixa = FaixaPromocional.objects.order_by("-atualizado_em").first()
        if not faixa:
            faixa = FaixaPromocional.objects.create(mensagem="")
        return faixa

    def get(self, request):
        return Response(FaixaPromocionalSerializer(self._obter_ou_criar_faixa()).data)

    def patch(self, request):
        faixa = self._obter_ou_criar_faixa()
        serializer = FaixaPromocionalSerializer(faixa, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GestaoBannerLandingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = BannerLanding.objects.all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BannerLandingWriteSerializer
        return BannerLandingSerializer


class GestaoBannerLandingDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = BannerLanding.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BannerLandingWriteSerializer
        return BannerLandingSerializer

    def perform_destroy(self, instance):
        if instance.imagem:
            instance.imagem.delete(save=False)
        instance.delete()


class GestaoBannerUploadGifView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            banner = BannerLanding.objects.get(pk=pk)
        except BannerLanding.DoesNotExist:
            return Response({"detail": "Banner não encontrado."}, status=404)

        arquivo = request.FILES.get("gif")
        if not arquivo:
            return Response({"detail": "Envie o arquivo gif."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        if ext not in GIF_EXT:
            return Response({"detail": "Somente GIF é permitido."}, status=400)

        max_bytes = GIF_MAX_MB * 1024 * 1024
        if arquivo.size > max_bytes:
            return Response({"detail": f"GIF excede {GIF_MAX_MB}MB."}, status=400)

        if banner.imagem:
            banner.imagem.delete(save=False)
        banner.imagem = arquivo
        banner.save()
        return Response(BannerLandingSerializer(banner).data)
