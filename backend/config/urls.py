"""Roteamento principal da API e admin."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.cursos.urls_gestao")),
    path("api/", include("apps.cursos.urls_extras")),
    path("api/", include("apps.cursos.urls")),
    path("api/", include("apps.core.urls")),
]
