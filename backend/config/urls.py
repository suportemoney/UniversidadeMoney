"""Roteamento principal da API e admin."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.accounts.urls_gestao")),
    path("api/", include("apps.planos.urls_gestao")),
    path("api/", include("apps.cursos.urls_gestao")),
    path("api/", include("apps.planos.urls")),
    path("api/", include("apps.landing.urls")),
    path("api/", include("apps.landing.urls_gestao")),
    path("api/", include("apps.cursos.urls_extras")),
    path("api/", include("apps.cursos.urls")),
    path("api/", include("apps.core.urls")),
]

# Em desenvolvimento, serve uploads (vídeos, thumbs) em /media/
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
