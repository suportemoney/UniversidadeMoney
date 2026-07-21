"""Views da API de planos para alunos — desativadas no LMS interno."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions_api import IsFrontendJwtOrApiKey

MSG_DESATIVADO = "Planos comerciais foram desativados. A plataforma opera em modo interno."


class MinhaAssinaturaView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey]

    def get(self, request):
        return Response(
            {"detail": MSG_DESATIVADO, "tem_plano": True, "assinatura": None},
            status=status.HTTP_410_GONE,
        )


class ResgatarTokenView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey]

    def post(self, request):
        return Response({"detail": MSG_DESATIVADO}, status=status.HTTP_410_GONE)


class CatalogoPlanosView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey]

    def get(self, request):
        return Response({"detail": MSG_DESATIVADO}, status=status.HTTP_410_GONE)
