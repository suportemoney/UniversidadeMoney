"""Views da API de gestão de conteúdo."""
import os

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Atividade,
    AulaVideo,
    Comunicado,
    Curso,
    MaterialBiblioteca,
    Modulo,
    ProvaFinal,
    Questao,
    Setor,
    TagCurso,
    TreinamentoAoVivo,
    Trilha,
    TrilhaCurso,
)
from .permissions import IsGestor, IsSuperuserGestao
from .serializers_gestao import (
    AtividadeSerializer,
    AulaVideoSerializer,
    ComunicadoSerializer,
    CursoGestaoDetailSerializer,
    CursoGestaoListSerializer,
    CursoGestaoWriteSerializer,
    MaterialBibliotecaSerializer,
    ModuloSerializer,
    ProvaFinalSerializer,
    QuestaoSerializer,
    SetorSerializer,
    TagCursoSerializer,
    TreinamentoAoVivoSerializer,
    TrilhaCursoItemSerializer,
    TrilhaGestaoSerializer,
    TrilhaGestaoWriteSerializer,
    UsuarioEquipeSerializer,
)
from .services import curso_pronto_publicar, recalcular_curso

VIDEO_MAX_MB = int(os.getenv("VIDEO_MAX_MB", "500"))
VIDEO_EXT = {".mp4", ".webm", ".mov"}
THUMB_EXT = {".jpg", ".jpeg", ".png", ".webp"}
PDF_MAX_MB = int(os.getenv("PDF_MAX_MB", "50"))
PDF_EXT = {".pdf"}


class GestaoResumoView(APIView):
    permission_classes = [IsGestor]

    def get(self, request):
        return Response(
            {
                "cursos_rascunho": Curso.objects.filter(status=Curso.STATUS_RASCUNHO).count(),
                "cursos_publicados": Curso.objects.filter(status=Curso.STATUS_PUBLICADO).count(),
                "cursos_arquivados": Curso.objects.filter(status=Curso.STATUS_ARQUIVADO).count(),
                "trilhas": Trilha.objects.count(),
                "setores": Setor.objects.count(),
            }
        )


class GestaoSetoresView(generics.ListAPIView):
    permission_classes = [IsGestor]
    queryset = Setor.objects.all()
    serializer_class = SetorSerializer


class GestaoUsuariosView(generics.ListAPIView):
    permission_classes = [IsSuperuserGestao]
    serializer_class = UsuarioEquipeSerializer

    def get_queryset(self):
        qs = User.objects.filter(is_active=True).select_related("profile").order_by("first_name")
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(email__icontains=q))
        return qs


class GestaoUsuarioEquipeView(APIView):
    permission_classes = [IsSuperuserGestao]

    def patch(self, request, user_id):
        try:
            user = User.objects.select_related("profile").get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=404)

        if user.is_superuser:
            return Response({"detail": "Não é possível alterar superuser."}, status=400)

        is_membro = request.data.get("is_membro_equipe")
        if is_membro is None:
            return Response({"detail": "Informe is_membro_equipe."}, status=400)

        user.profile.is_membro_equipe = bool(is_membro)
        user.profile.save(update_fields=["is_membro_equipe"])
        return Response(UsuarioEquipeSerializer(user).data)


class GestaoCursosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CursoGestaoWriteSerializer
        return CursoGestaoListSerializer

    def get_queryset(self):
        qs = Curso.objects.select_related("setor", "criado_por").prefetch_related("tags").all()
        status_f = self.request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        return qs

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)


class GestaoCursoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    queryset = Curso.objects.select_related("setor").prefetch_related(
        "modulos__aulas", "modulos__atividades__questoes", "tags"
    )

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CursoGestaoWriteSerializer
        return CursoGestaoDetailSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = CursoGestaoWriteSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        return Response(CursoGestaoDetailSerializer(instance).data)


class GestaoCursoPublicarView(APIView):
    permission_classes = [IsGestor]

    def post(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        erros = curso_pronto_publicar(curso)
        if erros:
            return Response({"detail": "Curso incompleto.", "erros": erros}, status=400)

        curso.status = Curso.STATUS_PUBLICADO
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoCursoArquivarView(APIView):
    permission_classes = [IsGestor]

    def post(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        curso.status = Curso.STATUS_ARQUIVADO
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoCursosDisponiveisView(generics.ListAPIView):
    permission_classes = [IsGestor]
    serializer_class = CursoGestaoListSerializer

    def get_queryset(self):
        return Curso.objects.filter(status=Curso.STATUS_PUBLICADO).select_related("setor")


class GestaoModulosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = ModuloSerializer

    def get_queryset(self):
        return Modulo.objects.filter(curso_id=self.kwargs["curso_id"]).prefetch_related("aulas", "atividades")

    def perform_create(self, serializer):
        curso_id = self.kwargs["curso_id"]
        ordem = Modulo.objects.filter(curso_id=curso_id).count()
        modulo = serializer.save(curso_id=curso_id, ordem=ordem)
        recalcular_curso(modulo.curso)


class GestaoModuloDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = ModuloSerializer
    queryset = Modulo.objects.all()

    def perform_update(self, serializer):
        modulo = serializer.save()
        recalcular_curso(modulo.curso)

    def perform_destroy(self, instance):
        curso = instance.curso
        instance.delete()
        recalcular_curso(curso)


class GestaoModulosReordenarView(APIView):
    permission_classes = [IsGestor]

    def post(self, request, curso_id):
        ids = request.data.get("ordem", [])
        if not isinstance(ids, list):
            return Response({"detail": "Informe lista ordem."}, status=400)
        with transaction.atomic():
            for idx, mid in enumerate(ids):
                Modulo.objects.filter(pk=mid, curso_id=curso_id).update(ordem=idx)
        modulos = Modulo.objects.filter(curso_id=curso_id).prefetch_related("aulas", "atividades")
        return Response(ModuloSerializer(modulos, many=True).data)


class GestaoAulasListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = AulaVideoSerializer

    def get_queryset(self):
        return AulaVideo.objects.filter(modulo_id=self.kwargs["modulo_id"])

    def perform_create(self, serializer):
        modulo_id = self.kwargs["modulo_id"]
        ordem = AulaVideo.objects.filter(modulo_id=modulo_id).count()
        aula = serializer.save(modulo_id=modulo_id, ordem=ordem)
        recalcular_curso(aula.modulo.curso)


class GestaoAulaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = AulaVideoSerializer
    queryset = AulaVideo.objects.select_related("modulo__curso")

    def perform_update(self, serializer):
        aula = serializer.save()
        recalcular_curso(aula.modulo.curso)

    def perform_destroy(self, instance):
        curso = instance.modulo.curso
        if instance.video:
            instance.video.delete(save=False)
        instance.delete()
        recalcular_curso(curso)


class GestaoAulaUploadVideoView(APIView):
    permission_classes = [IsGestor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            aula = AulaVideo.objects.select_related("modulo__curso").get(pk=pk)
        except AulaVideo.DoesNotExist:
            return Response({"detail": "Aula não encontrada."}, status=404)

        arquivo = request.FILES.get("video")
        if not arquivo:
            return Response({"detail": "Envie o arquivo video."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        if ext not in VIDEO_EXT:
            return Response({"detail": f"Formato não permitido. Use: {', '.join(VIDEO_EXT)}"}, status=400)

        max_bytes = VIDEO_MAX_MB * 1024 * 1024
        if arquivo.size > max_bytes:
            return Response({"detail": f"Vídeo excede {VIDEO_MAX_MB}MB."}, status=400)

        if aula.video:
            aula.video.delete(save=False)

        aula.video = arquivo
        duracao = request.data.get("duracao_segundos")
        if duracao:
            aula.duracao_segundos = int(duracao)
        aula.save()
        recalcular_curso(aula.modulo.curso)
        return Response(AulaVideoSerializer(aula).data)


class GestaoAulaRemoverVideoView(APIView):
    permission_classes = [IsGestor]

    def delete(self, request, pk):
        try:
            aula = AulaVideo.objects.select_related("modulo__curso").get(pk=pk)
        except AulaVideo.DoesNotExist:
            return Response({"detail": "Aula não encontrada."}, status=404)

        if aula.video:
            aula.video.delete(save=False)
            aula.video = None
            aula.duracao_segundos = 0
            aula.save()
            recalcular_curso(aula.modulo.curso)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GestaoAtividadesListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = AtividadeSerializer

    def get_queryset(self):
        return Atividade.objects.filter(modulo_id=self.kwargs["modulo_id"]).prefetch_related("questoes")

    def perform_create(self, serializer):
        modulo_id = self.kwargs["modulo_id"]
        ordem = Atividade.objects.filter(modulo_id=modulo_id).count()
        serializer.save(modulo_id=modulo_id, ordem=ordem)


class GestaoAtividadeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = AtividadeSerializer
    queryset = Atividade.objects.prefetch_related("questoes")


class GestaoAtividadeQuestoesView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = QuestaoSerializer

    def get_queryset(self):
        return Questao.objects.filter(atividade_id=self.kwargs["atividade_id"])

    def perform_create(self, serializer):
        atividade_id = self.kwargs["atividade_id"]
        ordem = Questao.objects.filter(atividade_id=atividade_id).count()
        serializer.save(atividade_id=atividade_id, ordem=ordem)


class GestaoQuestaoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = QuestaoSerializer
    queryset = Questao.objects.all()


class GestaoProvaView(APIView):
    permission_classes = [IsGestor]

    def get(self, request, curso_id):
        try:
            prova = ProvaFinal.objects.prefetch_related("questoes").get(curso_id=curso_id)
        except ProvaFinal.DoesNotExist:
            return Response({"detail": "Prova não configurada."}, status=404)
        return Response(ProvaFinalSerializer(prova).data)

    def post(self, request, curso_id):
        prova, _ = ProvaFinal.objects.get_or_create(curso_id=curso_id)
        serializer = ProvaFinalSerializer(prova, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProvaFinalSerializer(prova).data)


class GestaoProvaQuestoesView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = QuestaoSerializer

    def get_queryset(self):
        return Questao.objects.filter(prova_id=self.kwargs["prova_id"])

    def perform_create(self, serializer):
        prova_id = self.kwargs["prova_id"]
        ordem = Questao.objects.filter(prova_id=prova_id).count()
        serializer.save(prova_id=prova_id, ordem=ordem)


class GestaoTrilhasListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TrilhaGestaoWriteSerializer
        return TrilhaGestaoSerializer

    def get_queryset(self):
        return Trilha.objects.select_related("setor").prefetch_related("itens__curso")

    def create(self, request, *args, **kwargs):
        serializer = TrilhaGestaoWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trilha = serializer.save()
        return Response(TrilhaGestaoSerializer(trilha).data, status=status.HTTP_201_CREATED)


class GestaoTrilhaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    queryset = Trilha.objects.select_related("setor").prefetch_related("itens__curso")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TrilhaGestaoWriteSerializer
        return TrilhaGestaoSerializer

    def update(self, request, *args, **kwargs):
        trilha = self.get_object()
        serializer = TrilhaGestaoWriteSerializer(trilha, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TrilhaGestaoSerializer(trilha).data)


class GestaoTrilhaCursosView(APIView):
    permission_classes = [IsGestor]

    def post(self, request, pk):
        try:
            trilha = Trilha.objects.get(pk=pk)
        except Trilha.DoesNotExist:
            return Response({"detail": "Trilha não encontrada."}, status=404)

        curso_ids = request.data.get("curso_ids", [])
        if not isinstance(curso_ids, list):
            return Response({"detail": "Informe curso_ids como lista."}, status=400)

        publicados = set(
            Curso.objects.filter(pk__in=curso_ids, status=Curso.STATUS_PUBLICADO).values_list("pk", flat=True)
        )
        invalidos = [cid for cid in curso_ids if cid not in publicados]
        if invalidos:
            return Response(
                {"detail": "Somente cursos publicados podem entrar na trilha.", "invalidos": invalidos},
                status=400,
            )

        with transaction.atomic():
            TrilhaCurso.objects.filter(trilha=trilha).delete()
            for idx, cid in enumerate(curso_ids):
                TrilhaCurso.objects.create(trilha=trilha, curso_id=cid, ordem=idx)

        trilha = Trilha.objects.prefetch_related("itens__curso").get(pk=pk)
        return Response(TrilhaGestaoSerializer(trilha).data)


class GestaoCursoUploadThumbnailView(APIView):
    permission_classes = [IsGestor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        arquivo = request.FILES.get("thumbnail")
        if not arquivo:
            return Response({"detail": "Envie o arquivo thumbnail."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        if ext not in THUMB_EXT:
            return Response({"detail": "Use jpg, png ou webp."}, status=400)

        if curso.thumbnail:
            curso.thumbnail.delete(save=False)
        curso.thumbnail = arquivo
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoComunicadosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = ComunicadoSerializer
    queryset = Comunicado.objects.all()


class GestaoComunicadoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = ComunicadoSerializer
    queryset = Comunicado.objects.all()


class GestaoAoVivoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = TreinamentoAoVivoSerializer
    queryset = TreinamentoAoVivo.objects.select_related("setor").prefetch_related("tags")


class GestaoAoVivoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = TreinamentoAoVivoSerializer
    queryset = TreinamentoAoVivo.objects.select_related("setor").prefetch_related("tags")


class GestaoBibliotecaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    serializer_class = MaterialBibliotecaSerializer
    queryset = MaterialBiblioteca.objects.select_related("setor")


class GestaoBibliotecaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    serializer_class = MaterialBibliotecaSerializer
    queryset = MaterialBiblioteca.objects.select_related("setor")

    def perform_destroy(self, instance):
        if instance.arquivo:
            instance.arquivo.delete(save=False)
        instance.delete()


class GestaoBibliotecaUploadPdfView(APIView):
    permission_classes = [IsGestor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            material = MaterialBiblioteca.objects.get(pk=pk)
        except MaterialBiblioteca.DoesNotExist:
            return Response({"detail": "Material não encontrado."}, status=404)

        arquivo = request.FILES.get("pdf")
        if not arquivo:
            return Response({"detail": "Envie o arquivo pdf."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        if ext not in PDF_EXT:
            return Response({"detail": "Somente PDF é permitido."}, status=400)

        max_bytes = PDF_MAX_MB * 1024 * 1024
        if arquivo.size > max_bytes:
            return Response({"detail": f"PDF excede {PDF_MAX_MB}MB."}, status=400)

        if material.arquivo:
            material.arquivo.delete(save=False)
        material.arquivo = arquivo
        material.save()
        return Response(MaterialBibliotecaSerializer(material).data)


class GestaoTagsListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsGestor]
    queryset = TagCurso.objects.all()
    serializer_class = TagCursoSerializer


class GestaoTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsGestor]
    queryset = TagCurso.objects.all()
    serializer_class = TagCursoSerializer
