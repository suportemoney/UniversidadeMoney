from django.urls import path

from . import views, views_api, views_mfa

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path(
        "refresh/",
        views_mfa.TokenRefreshComMfaView.as_view(),
        name="auth-refresh",
    ),
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
        "api-tokens/trocar/",
        views_api.ApiTokenTrocarView.as_view(),
        name="auth-api-tokens-trocar",
    ),
    path(
        "mfa/verificar-cpf/",
        views_mfa.MfaVerificarCpfView.as_view(),
        name="auth-mfa-verificar-cpf",
    ),
    path(
        "mfa/enroll/",
        views_mfa.MfaEnrollView.as_view(),
        name="auth-mfa-enroll",
    ),
    path(
        "mfa/confirmar/",
        views_mfa.MfaConfirmarView.as_view(),
        name="auth-mfa-confirmar",
    ),
    path(
        "mfa/verificar/",
        views_mfa.MfaVerificarView.as_view(),
        name="auth-mfa-verificar",
    ),
]
