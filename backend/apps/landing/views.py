"""API pública da landing."""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BannerLanding, FaixaPromocional
from .serializers import (
    BannerLandingPublicSerializer,
    FaixaPromocionalPublicSerializer,
    PlanoLandingSerializer,
)


class LandingPublicView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faixa = FaixaPromocional.objects.filter(ativo=True).order_by("-atualizado_em").first()
        banners = BannerLanding.objects.filter(ativo=True).exclude(imagem="")
        return Response({
            "faixa": FaixaPromocionalPublicSerializer(faixa).data if faixa else None,
            "banners": BannerLandingPublicSerializer(banners, many=True).data,
            "planos": PlanoLandingSerializer.listar_ativos(),
        })
