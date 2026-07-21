from django.urls import path

from . import views_api, views_gestao

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
    path(
        "gestao/convites/usuario/<int:user_id>/redefinir-senha/",
        views_gestao.GestaoConviteRedefinirSenhaView.as_view(),
        name="gestao-convite-redefinir-senha",
    ),
    path(
        "gestao/convites/usuario/<int:user_id>/perfil/",
        views_gestao.GestaoConvitePerfilView.as_view(),
        name="gestao-convite-perfil",
    ),
    path(
        "gestao/api-docs/catalogo/",
        views_api.GestaoApiDocsCatalogoView.as_view(),
        name="gestao-api-docs-catalogo",
    ),
    path(
        "gestao/api-docs/tokens/",
        views_api.GestaoApiTokensListView.as_view(),
        name="gestao-api-docs-tokens",
    ),
    path(
        "gestao/api-docs/tokens/temp/",
        views_api.GestaoApiTokenTempCreateView.as_view(),
        name="gestao-api-docs-tokens-temp",
    ),
    path(
        "gestao/api-docs/tokens/<int:pk>/revogar/",
        views_api.GestaoApiTokenRevogarView.as_view(),
        name="gestao-api-docs-tokens-revogar",
    ),
]
