"""Views do app core."""
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(request):
    """Endpoint de saúde para validar deploy e nginx."""
    return Response({"status": "ok"})
