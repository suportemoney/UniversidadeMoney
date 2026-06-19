from django.urls import path

from . import views_catalogo, views_extras

urlpatterns = [
    path("busca/", views_catalogo.BuscaView.as_view(), name="busca"),
    path("cursos/", views_catalogo.CatalogoCursosView.as_view(), name="catalogo-cursos"),
    path("trilhas/", views_catalogo.TrilhasAlunoListView.as_view(), name="trilhas-aluno"),
    path("trilhas/<int:pk>/", views_catalogo.TrilhaAlunoDetailView.as_view(), name="trilha-aluno-detail"),
    path("certificados/", views_extras.CertificadosListView.as_view(), name="certificados"),
    path("certificados/<int:pk>/download/", views_extras.CertificadoDownloadView.as_view(), name="certificado-download"),
    path("ranking/", views_extras.RankingView.as_view(), name="ranking"),
    path("progresso/", views_extras.ProgressoView.as_view(), name="progresso"),
    path("comunicados/", views_extras.ComunicadosListView.as_view(), name="comunicados"),
    path("comunicados/nao-lidos/", views_extras.ComunicadosNaoLidosView.as_view(), name="comunicados-nao-lidos"),
    path("comunicados/<int:pk>/lido/", views_extras.ComunicadoMarcarLidoView.as_view(), name="comunicado-lido"),
    path("ao-vivo/", views_extras.AoVivoListView.as_view(), name="ao-vivo"),
    path("ao-vivo/<int:pk>/inscrever/", views_extras.AoVivoInscreverView.as_view(), name="ao-vivo-inscrever"),
    path("biblioteca/", views_extras.BibliotecaListView.as_view(), name="biblioteca"),
    path("conquistas/", views_extras.ConquistasListView.as_view(), name="conquistas"),
]
