from django.urls import path

from . import views, views_aluno

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("cursos/<int:curso_id>/matricular/", views.MatricularView.as_view(), name="matricular"),
    path("meus-cursos/", views_aluno.MeusCursosView.as_view(), name="meus-cursos"),
    path("cursos/<int:curso_id>/conteudo/", views_aluno.CursoAlunoDetailView.as_view(), name="curso-conteudo"),
    path("aulas/<int:aula_id>/concluir/", views_aluno.ConcluirAulaView.as_view(), name="aula-concluir"),
    path("aulas/<int:aula_id>/progresso/", views_aluno.ProgressoAulaView.as_view(), name="aula-progresso"),
    path("atividades/<int:atividade_id>/", views_aluno.AtividadeAlunoView.as_view(), name="atividade-aluno"),
    path("provas/<int:prova_id>/", views_aluno.ProvaAlunoView.as_view(), name="prova-aluno"),
]