from django.urls import path

from . import views_gestao

urlpatterns = [
    path(
        "gestao/convites/",
        views_gestao.GestaoConvitesListCreateView.as_view(),
        name="gestao-convites",
    ),
    path(
        "gestao/convites/<int:pk>/revogar/",
        views_gestao.GestaoConviteRevogarView.as_view(),
        name="gestao-convite-revogar",
    ),
    path(
        "gestao/convites/usuario/<int:user_id>/regenerar/",
        views_gestao.GestaoConviteRegenerarView.as_view(),
        name="gestao-convite-regenerar",
    ),
]
