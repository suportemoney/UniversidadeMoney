from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.MeView.as_view(), name="auth-me"),
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
]
