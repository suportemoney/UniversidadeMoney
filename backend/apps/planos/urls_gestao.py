from django.urls import path

from . import views_gestao

urlpatterns = [
    path("gestao/planos/", views_gestao.GestaoPlanosListCreateView.as_view(), name="gestao-planos"),
    path("gestao/planos/<int:pk>/", views_gestao.GestaoPlanoDetailView.as_view(), name="gestao-plano-detail"),
    path("gestao/tokens/", views_gestao.GestaoTokensListCreateView.as_view(), name="gestao-tokens"),
    path("gestao/tokens/<int:pk>/", views_gestao.GestaoTokenDetailView.as_view(), name="gestao-token-detail"),
    path("gestao/tokens/<int:pk>/usos/", views_gestao.GestaoTokenUsosView.as_view(), name="gestao-token-usos"),
]
