from django.urls import path

from . import views

urlpatterns = [
    path("landing/", views.LandingPublicView.as_view(), name="landing-public"),
]
