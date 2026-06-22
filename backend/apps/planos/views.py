"""Views da API de planos para alunos."""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Plano
from .serializers import PlanoCatalogoSerializer, ResgatarTokenSerializer
from .services import assinatura_ativa, resgatar_token, serializar_assinatura


class MinhaAssinaturaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        assin = assinatura_ativa(request.user)
        return Response({
            "tem_plano": assin is not None,
            "assinatura": serializar_assinatura(assin),
        })


class ResgatarTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ResgatarTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            assin = resgatar_token(serializer.validated_data["chave"], request.user)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)
        return Response({
            "message": "Plano ativado com sucesso!",
            "assinatura": serializar_assinatura(assin),
        })


class CatalogoPlanosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        planos = Plano.objects.filter(ativo=True)
        return Response(PlanoCatalogoSerializer(planos, many=True).data)
