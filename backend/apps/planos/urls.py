from django.urls import path

from . import views

urlpatterns = [
    path("planos/minha-assinatura/", views.MinhaAssinaturaView.as_view(), name="minha-assinatura"),
    path("planos/resgatar/", views.ResgatarTokenView.as_view(), name="resgatar-token"),
    path("planos/catalogo/", views.CatalogoPlanosView.as_view(), name="catalogo-planos"),
]
