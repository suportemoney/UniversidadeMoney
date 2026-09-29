from django.urls import path

from . import views, views_api

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("refresh/", views.TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.MeView.as_view(), name="auth-me"),
    path(
        "redefinir-senha-obrigatoria/",
        views.RedefinirSenhaObrigatoriaView.as_view(),
        name="auth-redefinir-senha-obrigatoria",
    ),
    path(
        "token-acesso/validar/",
        views.TokenAcessoValidarView.as_view(),
        name="auth-token-acesso-validar",
    ),
    path(
        "token-acesso/ativar/",
        views.TokenAcessoAtivarView.as_view(),
        name="auth-token-acesso-ativar",
    ),
    path(
        "recuperar-senha/",
        views.RecuperarSenhaView.as_view(),
        name="auth-recuperar-senha",
    ),
    path(
        "recuperar-senha/confirmar/",
        views.RecuperarSenhaConfirmarView.as_view(),
        name="auth-recuperar-senha-confirmar",
    ),
    path(
        "api-tokens/trocar/",
        views_api.ApiTokenTrocarView.as_view(),
        name="auth-api-tokens-trocar",
    ),
]
