from django.urls import path

from . import views_gestao

urlpatterns = [
    path(
        "gestao/landing/faixa/",
        views_gestao.GestaoFaixaPromocionalView.as_view(),
        name="gestao-landing-faixa",
    ),
    path(
        "gestao/landing/banners/",
        views_gestao.GestaoBannerLandingListCreateView.as_view(),
        name="gestao-landing-banners",
    ),
    path(
        "gestao/landing/banners/<int:pk>/",
        views_gestao.GestaoBannerLandingDetailView.as_view(),
        name="gestao-landing-banner-detail",
    ),
    path(
        "gestao/landing/banners/<int:pk>/upload-gif/",
        views_gestao.GestaoBannerUploadGifView.as_view(),
        name="gestao-landing-banner-upload",
    ),
]
