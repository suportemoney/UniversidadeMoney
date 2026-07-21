"""Views da API de gestão de conteúdo."""
import os
from apps.accounts.permissions_api import IsFrontendJwtOrApiKey

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Profile
from apps.planos.models import AssinaturaUsuario, Plano, TokenPlano

from .models import (
    Atividade,
    AulaVideo,
    Comunicado,
    Curso,
    CursoMaterial,
    CursoParticipante,
    MaterialBiblioteca,
    Matricula,
    Modulo,
    ModuloArquivo,
    ProvaFinal,
    Questao,
    Setor,
    TagCurso,
    TreinamentoAoVivo,
    Trilha,
    TrilhaCurso,
)
from .media_convert import MediaConvertError, converter_imagem_para_webp, converter_video_para_webm
from .permissions import (
    EscopoNaoSomenteCursos,
    IsGestor,
    PodeEquipe,
    PodeExcluir,
)
from .serializers_gestao import (
    AtividadeSerializer,
    AulaVideoSerializer,
    ComunicadoSerializer,
    CursoGestaoDetailSerializer,
    CursoGestaoListSerializer,
    CursoGestaoWriteSerializer,
    CursoMaterialSerializer,
    CursoParticipanteSerializer,
    MaterialBibliotecaSerializer,
    ModuloArquivoSerializer,
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
    UsuarioEquipeCreateSerializer,
    UsuarioEquipeUpdateSerializer,
)
from .services import curso_pronto_publicar, recalcular_curso

VIDEO_MAX_MB = int(os.getenv("VIDEO_MAX_MB", "500"))
# Entrada: qualquer formato comum; saída sempre .webm (exceto se já for .webm)
VIDEO_EXT = {
    ".webm",
    ".mp4",
    ".m4v",
    ".mov",
    ".avi",
    ".mkv",
    ".mpeg",
    ".mpg",
    ".wmv",
    ".flv",
    ".3gp",
    ".ogv",
    ".ts",
}
THUMB_EXT = {".jpg", ".jpeg", ".png", ".webp"}
PDF_MAX_MB = int(os.getenv("PDF_MAX_MB", "50"))
PDF_EXT = {".pdf"}
AUDIO_EXT = {".mp3", ".wav", ".ogg", ".m4a", ".aac"}
ARQUIVO_MAX_MB = int(os.getenv("ARQUIVO_MAX_MB", "50"))


class GestaoResumoView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

    def get(self, request):
        hoje = timezone.localdate()

        cursos_publicados = Curso.objects.filter(status=Curso.STATUS_PUBLICADO).count()
        cursos_rascunho = Curso.objects.filter(status=Curso.STATUS_RASCUNHO).count()
        cursos_arquivados = Curso.objects.filter(status=Curso.STATUS_ARQUIVADO).count()

        biblioteca_total = MaterialBiblioteca.objects.count()
        biblioteca_publicados = MaterialBiblioteca.objects.filter(publicado=True).count()
        ao_vivo_total = TreinamentoAoVivo.objects.count()
        ao_vivo_proximos = TreinamentoAoVivo.objects.filter(data__gte=hoje).count()

        ultimos_cursos = [
            {
                "id": c.id,
                "titulo": c.titulo,
                "status": c.status,
                "criado_em": c.criado_em.isoformat(),
            }
            for c in Curso.objects.order_by("-criado_em")[:5]
        ]

        proximos_ao_vivo = [
            {
                "id": t.id,
                "titulo": t.titulo,
                "data": t.data.isoformat(),
                "hora": t.hora.strftime("%H:%M"),
            }
            for t in TreinamentoAoVivo.objects.filter(data__gte=hoje).order_by("data", "hora")[:5]
        ]

        ultimos_comunicados = [
            {
                "id": c.id,
                "titulo": c.titulo,
                "tipo": c.tipo,
                "criado_em": c.criado_em.isoformat(),
            }
            for c in Comunicado.objects.order_by("-criado_em")[:5]
        ]

        return Response(
            {
                "kpis": {
                    "cursos_publicados": cursos_publicados,
                    "cursos_rascunho": cursos_rascunho,
                    "cursos_arquivados": cursos_arquivados,
                    "trilhas": Trilha.objects.count(),
                    "comunicados": Comunicado.objects.count(),
                    "biblioteca_total": biblioteca_total,
                    "biblioteca_publicados": biblioteca_publicados,
                    "ao_vivo_total": ao_vivo_total,
                    "ao_vivo_proximos": ao_vivo_proximos,
                    "tags_ativas": TagCurso.objects.filter(ativo=True).count(),
                    "setores": Setor.objects.count(),
                    "colaboradores_ativos": User.objects.filter(is_active=True).count(),
                    "matriculas": Matricula.objects.count(),
                    "assinaturas_ativas": AssinaturaUsuario.objects.filter(
                        status=AssinaturaUsuario.STATUS_ATIVA
                    ).count(),
                    "membros_equipe": Profile.objects.filter(is_membro_equipe=True).count(),
                    "planos_ativos": Plano.objects.filter(ativo=True).count(),
                    "tokens_ativos": TokenPlano.objects.filter(ativo=True).count(),
                },
                "cursos_por_status": [
                    {"status": "publicado", "label": "Publicados", "total": cursos_publicados},
                    {"status": "rascunho", "label": "Rascunhos", "total": cursos_rascunho},
                    {"status": "arquivado", "label": "Arquivados", "total": cursos_arquivados},
                ],
                "ultimos_cursos": ultimos_cursos,
                "proximos_ao_vivo": proximos_ao_vivo,
                "ultimos_comunicados": ultimos_comunicados,
                "alertas": {
                    "rascunhos_pendentes": cursos_rascunho,
                    "materiais_nao_publicados": biblioteca_total - biblioteca_publicados,
                },
            }
        )


class GestaoSetoresListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = Setor.objects.all().order_by("ordem", "nome")
    serializer_class = SetorSerializer


class GestaoSetorDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = Setor.objects.all().order_by("ordem", "nome")
    serializer_class = SetorSerializer


class GestaoUsuariosView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeEquipe]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UsuarioEquipeCreateSerializer
        return UsuarioEquipeSerializer

    def get_queryset(self):
        from apps.cursos.permissions import NIVEIS_EQUIPE

        qs = (
            User.objects.filter(is_active=True)
            .filter(Q(is_superuser=True) | Q(profile__nivel_acesso__in=NIVEIS_EQUIPE))
            .select_related("profile", "profile__setor")
            .order_by("first_name")
        )
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(first_name__icontains=q) | Q(email__icontains=q))
        return qs

    def create(self, request, *args, **kwargs):
        serializer = UsuarioEquipeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UsuarioEquipeSerializer(user).data, status=status.HTTP_201_CREATED)


class GestaoUsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeEquipe]
    lookup_url_kwarg = "user_id"

    def get_queryset(self):
        return User.objects.filter(is_active=True).select_related("profile", "profile__setor")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UsuarioEquipeUpdateSerializer
        return UsuarioEquipeSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = UsuarioEquipeUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UsuarioEquipeSerializer(user).data)

    def perform_destroy(self, instance):
        if instance.is_superuser:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Não é possível inativar superuser.")
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        if hasattr(instance, "profile"):
            instance.profile.is_membro_equipe = False
            instance.profile.save(update_fields=["is_membro_equipe"])


class GestaoUsuarioExcluirPermanenteView(APIView):
    """Remove o usuário do banco (exclusão permanente)."""

    permission_classes = [IsFrontendJwtOrApiKey, PodeEquipe, PodeExcluir]

    def delete(self, request, user_id):
        try:
            user = User.objects.select_related("profile").get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Usuário não encontrado."}, status=404)

        if user.is_superuser:
            return Response(
                {"detail": "Não é possível excluir permanentemente um superuser."},
                status=400,
            )
        if user.pk == request.user.pk:
            return Response(
                {"detail": "Não é possível excluir a própria conta."},
                status=400,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GestaoUsuarioEquipeView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, PodeEquipe]

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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    queryset = Curso.objects.select_related("setor", "instrutor").prefetch_related(
        "modulos__aulas",
        "modulos__atividades__questoes",
        "modulos__arquivos",
        "participantes",
        "tags",
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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

    def post(self, request, pk):
        try:
            curso = Curso.objects.prefetch_related("modulos__aulas", "modulos__arquivos").get(pk=pk)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        erros = curso_pronto_publicar(curso)
        if erros:
            return Response({"detail": "Curso incompleto.", "erros": erros}, status=400)

        curso.status = Curso.STATUS_PUBLICADO
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoCursoArquivarView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

    def post(self, request, pk):
        try:
            curso = Curso.objects.get(pk=pk)
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        curso.status = Curso.STATUS_ARQUIVADO
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoCursosDisponiveisView(generics.ListAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = CursoGestaoListSerializer

    def get_queryset(self):
        return Curso.objects.filter(status=Curso.STATUS_PUBLICADO).select_related("setor")


class GestaoModulosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = ModuloSerializer

    def get_queryset(self):
        return Modulo.objects.filter(curso_id=self.kwargs["curso_id"]).prefetch_related(
            "aulas", "atividades", "arquivos"
        )

    def perform_create(self, serializer):
        curso_id = self.kwargs["curso_id"]
        ordem = Modulo.objects.filter(curso_id=curso_id).count()
        # Estrutura nova: módulos sempre de vídeo
        modulo = serializer.save(curso_id=curso_id, ordem=ordem, tipo=Modulo.TIPO_VIDEO)
        recalcular_curso(modulo.curso)


class GestaoCursoParticipantesListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = CursoParticipanteSerializer

    def get_queryset(self):
        return CursoParticipante.objects.filter(curso_id=self.kwargs["curso_id"])

    def perform_create(self, serializer):
        curso_id = self.kwargs["curso_id"]
        ordem = CursoParticipante.objects.filter(curso_id=curso_id).count()
        serializer.save(curso_id=curso_id, ordem=ordem)


class GestaoParticipanteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = CursoParticipanteSerializer
    queryset = CursoParticipante.objects.all()


class GestaoModuloArquivosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = ModuloArquivoSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ModuloArquivo.objects.filter(modulo_id=self.kwargs["modulo_id"])

    def create(self, request, *args, **kwargs):
        try:
            modulo = Modulo.objects.get(pk=self.kwargs["modulo_id"])
        except Modulo.DoesNotExist:
            return Response({"detail": "Módulo não encontrado."}, status=404)
        if modulo.tipo != Modulo.TIPO_APOSTILA:
            return Response({"detail": "Este módulo não aceita arquivos."}, status=400)

        titulo = request.data.get("titulo", "").strip()
        tipo_arquivo = request.data.get("tipo", ModuloArquivo.TIPO_PDF)
        arquivo = request.FILES.get("arquivo")
        if not titulo:
            return Response({"detail": "Informe o título do arquivo."}, status=400)
        if not arquivo:
            return Response({"detail": "Envie o arquivo."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        extensoes = PDF_EXT if tipo_arquivo == ModuloArquivo.TIPO_PDF else AUDIO_EXT
        if ext not in extensoes:
            return Response({"detail": f"Formato não permitido para {tipo_arquivo}."}, status=400)

        max_bytes = ARQUIVO_MAX_MB * 1024 * 1024
        if arquivo.size > max_bytes:
            return Response({"detail": f"Arquivo excede {ARQUIVO_MAX_MB}MB."}, status=400)

        ordem = ModuloArquivo.objects.filter(modulo=modulo).count()
        obj = ModuloArquivo.objects.create(
            modulo=modulo,
            titulo=titulo,
            tipo=tipo_arquivo,
            arquivo=arquivo,
            ordem=ordem,
        )
        recalcular_curso(modulo.curso)
        return Response(ModuloArquivoSerializer(obj).data, status=status.HTTP_201_CREATED)


class GestaoModuloArquivoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = ModuloArquivoSerializer
    queryset = ModuloArquivo.objects.select_related("modulo__curso")

    def perform_update(self, serializer):
        obj = serializer.save()
        recalcular_curso(obj.modulo.curso)

    def perform_destroy(self, instance):
        curso = instance.modulo.curso
        if instance.arquivo:
            instance.arquivo.delete(save=False)
        instance.delete()
        recalcular_curso(curso)


class GestaoModuloDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

    def post(self, request, curso_id):
        ids = request.data.get("ordem", [])
        if not isinstance(ids, list):
            return Response({"detail": "Informe lista ordem."}, status=400)
        with transaction.atomic():
            for idx, mid in enumerate(ids):
                Modulo.objects.filter(pk=mid, curso_id=curso_id).update(ordem=idx)
        modulos = Modulo.objects.filter(curso_id=curso_id).prefetch_related("aulas", "atividades", "arquivos")
        return Response(ModuloSerializer(modulos, many=True).data)


class GestaoAulasListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = AulaVideoSerializer

    def get_queryset(self):
        return AulaVideo.objects.filter(modulo_id=self.kwargs["modulo_id"])

    def perform_create(self, serializer):
        modulo_id = self.kwargs["modulo_id"]
        try:
            modulo = Modulo.objects.get(pk=modulo_id)
        except Modulo.DoesNotExist:
            raise ValidationError({"detail": "Módulo não encontrado."})
        # Aceita vídeo em qualquer módulo (estrutura nova força tipo video na criação)
        ordem = AulaVideo.objects.filter(modulo_id=modulo_id).count()
        aula = serializer.save(modulo_id=modulo_id, ordem=ordem)
        recalcular_curso(aula.modulo.curso)


class GestaoAulaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
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

        # Guarda o arquivo original (mp4/webm/…).
        # Conversão síncrona MP4→WebM (VP9) estourava timeout do gunicorn (HTTP 500).
        try:
            try:
                arquivo.seek(0)
            except Exception:
                pass
            nome_safe = f"video{ext}" if ext else "video.mp4"
            video_file = ContentFile(arquivo.read(), name=nome_safe)
            aula.video.save(nome_safe, video_file, save=False)
        except Exception as exc:
            return Response(
                {"detail": f"Falha ao salvar o vídeo: {exc}"},
                status=500,
            )

        duracao = request.data.get("duracao_segundos")
        if duracao:
            try:
                aula.duracao_segundos = int(duracao)
            except (TypeError, ValueError):
                pass
        aula.save()
        recalcular_curso(aula.modulo.curso)
        return Response(AulaVideoSerializer(aula).data)


class GestaoAulaRemoverVideoView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = AtividadeSerializer

    def get_queryset(self):
        return Atividade.objects.filter(modulo_id=self.kwargs["modulo_id"]).prefetch_related("questoes")

    def perform_create(self, serializer):
        modulo_id = self.kwargs["modulo_id"]
        if Atividade.objects.filter(modulo_id=modulo_id).exists():
            raise ValidationError(
                {"detail": "Este módulo já possui a atividade avaliativa final."}
            )
        serializer.save(modulo_id=modulo_id, ordem=0)


class GestaoAtividadeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = AtividadeSerializer
    queryset = Atividade.objects.prefetch_related("questoes")


class GestaoAtividadeQuestoesView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = QuestaoSerializer

    def get_queryset(self):
        return Questao.objects.filter(atividade_id=self.kwargs["atividade_id"])

    def perform_create(self, serializer):
        atividade_id = self.kwargs["atividade_id"]
        ordem = Questao.objects.filter(atividade_id=atividade_id).count()
        serializer.save(atividade_id=atividade_id, ordem=ordem)


class GestaoQuestaoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = QuestaoSerializer
    queryset = Questao.objects.all()


class GestaoProvaView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]

    def get(self, request, curso_id):
        try:
            prova = ProvaFinal.objects.prefetch_related("questoes").get(curso_id=curso_id)
        except ProvaFinal.DoesNotExist:
            return Response({
                "titulo": "Prova final",
                "nota_minima": 70,
                "tentativas_max": 3,
                "tempo_limite_min": None,
                "questoes": [],
            })
        return Response(ProvaFinalSerializer(prova).data)

    def post(self, request, curso_id):
        prova, _ = ProvaFinal.objects.get_or_create(curso_id=curso_id)
        serializer = ProvaFinalSerializer(prova, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProvaFinalSerializer(prova).data)


class GestaoProvaQuestoesView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = QuestaoSerializer

    def get_queryset(self):
        return Questao.objects.filter(prova_id=self.kwargs["prova_id"])

    def perform_create(self, serializer):
        prova_id = self.kwargs["prova_id"]
        ordem = Questao.objects.filter(prova_id=prova_id).count()
        serializer.save(prova_id=prova_id, ordem=ordem)


class GestaoTrilhasListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]

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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]

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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
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

        try:
            webp = converter_imagem_para_webp(arquivo)
        except MediaConvertError as exc:
            return Response({"detail": str(exc)}, status=400)

        curso.thumbnail.save("thumb.webp", webp, save=False)
        curso.save()
        return Response(CursoGestaoDetailSerializer(curso).data)


class GestaoCursoMateriaisListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = CursoMaterialSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CursoMaterial.objects.filter(curso_id=self.kwargs["curso_id"])

    def create(self, request, *args, **kwargs):
        try:
            curso = Curso.objects.get(pk=self.kwargs["curso_id"])
        except Curso.DoesNotExist:
            return Response({"detail": "Curso não encontrado."}, status=404)

        titulo = request.data.get("titulo", "").strip()
        arquivo = request.FILES.get("arquivo")
        if not titulo:
            return Response({"detail": "Informe o título do material."}, status=400)
        if not arquivo:
            return Response({"detail": "Envie o PDF."}, status=400)

        ext = os.path.splitext(arquivo.name)[1].lower()
        if ext not in PDF_EXT:
            return Response({"detail": "Apenas PDF é permitido."}, status=400)

        max_bytes = PDF_MAX_MB * 1024 * 1024
        if arquivo.size > max_bytes:
            return Response({"detail": f"Arquivo excede {PDF_MAX_MB}MB."}, status=400)

        ordem = CursoMaterial.objects.filter(curso=curso).count()
        obj = CursoMaterial.objects.create(
            curso=curso,
            titulo=titulo,
            arquivo=arquivo,
            ordem=ordem,
        )
        return Response(CursoMaterialSerializer(obj).data, status=status.HTTP_201_CREATED)


class GestaoCursoMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, PodeExcluir]
    serializer_class = CursoMaterialSerializer
    queryset = CursoMaterial.objects.select_related("curso")

    def perform_destroy(self, instance):
        if instance.arquivo:
            instance.arquivo.delete(save=False)
        instance.delete()


class GestaoComunicadosListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = ComunicadoSerializer
    queryset = Comunicado.objects.all()


class GestaoComunicadoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = ComunicadoSerializer
    queryset = Comunicado.objects.all()


class GestaoAoVivoListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = TreinamentoAoVivoSerializer
    queryset = TreinamentoAoVivo.objects.select_related("setor").prefetch_related("tags")


class GestaoAoVivoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = TreinamentoAoVivoSerializer
    queryset = TreinamentoAoVivo.objects.select_related("setor").prefetch_related("tags")


class GestaoBibliotecaListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = MaterialBibliotecaSerializer
    queryset = MaterialBiblioteca.objects.select_related("setor")


class GestaoBibliotecaDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    serializer_class = MaterialBibliotecaSerializer
    queryset = MaterialBiblioteca.objects.select_related("setor")

    def perform_destroy(self, instance):
        if instance.arquivo:
            instance.arquivo.delete(save=False)
        instance.delete()


class GestaoBibliotecaUploadPdfView(APIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
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
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = TagCurso.objects.all()
    serializer_class = TagCursoSerializer


class GestaoTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFrontendJwtOrApiKey, IsGestor, EscopoNaoSomenteCursos, PodeExcluir]
    queryset = TagCurso.objects.all()
    serializer_class = TagCursoSerializer
