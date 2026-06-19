from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("cursos/<int:curso_id>/matricular/", views.MatricularView.as_view(), name="matricular"),
]
