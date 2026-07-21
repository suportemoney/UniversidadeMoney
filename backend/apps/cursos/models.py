"""Modelos da plataforma de cursos."""
import os
import uuid

from django.conf import settings
from django.db import models


def aula_video_upload_path(instance, filename):
    # Sempre .webm após conversão no upload
    uid = instance.pk or uuid.uuid4().hex[:12]
    return f"cursos/{instance.modulo.curso_id}/aulas/{uid}.webm"


def curso_thumbnail_upload_path(instance, filename):
    # Sempre .webp após conversão no upload
    return f"cursos/{instance.pk or 'novo'}/thumb.webp"


def modulo_arquivo_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    uid = instance.pk or uuid.uuid4().hex[:12]
    return f"cursos/{instance.modulo.curso_id}/modulos/{instance.modulo_id}/{uid}.{ext}"


def curso_material_upload_path(instance, filename):
    uid = instance.pk or uuid.uuid4().hex[:12]
    return f"cursos/{instance.curso_id}/materiais/{uid}.pdf"


class Setor(models.Model):
    nome = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icone = models.CharField(max_length=8, blank=True, default="📁")
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem", "nome"]
        verbose_name = "Setor"
        verbose_name_plural = "Setores"

    def __str__(self):
        return self.nome


class Trilha(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="trilhas"
    )

    class Meta:
        verbose_name = "Trilha"
        verbose_name_plural = "Trilhas"

    def __str__(self):
        return self.titulo


class TrilhaCurso(models.Model):
    trilha = models.ForeignKey(Trilha, on_delete=models.CASCADE, related_name="itens")
    curso = models.ForeignKey("Curso", on_delete=models.CASCADE, related_name="trilha_itens")
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]
        unique_together = [["trilha", "curso"]]
        verbose_name = "Curso na trilha"
        verbose_name_plural = "Cursos na trilha"


class TagCurso(models.Model):
    """Tag para categorizar cursos e restringir visibilidade por plano."""
    nome = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(unique=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "Tag de curso"
        verbose_name_plural = "Tags de curso"

    def __str__(self):
        return self.nome


class Curso(models.Model):
    STATUS_RASCUNHO = "rascunho"
    STATUS_PUBLICADO = "publicado"
    STATUS_ARQUIVADO = "arquivado"
    STATUS_CHOICES = [
        (STATUS_RASCUNHO, "Rascunho"),
        (STATUS_PUBLICADO, "Publicado"),
        (STATUS_ARQUIVADO, "Arquivado"),
    ]

    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    trilha = models.ForeignKey(
        Trilha, null=True, blank=True, on_delete=models.SET_NULL, related_name="cursos_legado"
    )
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="cursos"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RASCUNHO)
    publicado = models.BooleanField(default=False)
    duracao_horas = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    total_modulos = models.PositiveIntegerField(default=0)
    is_novo = models.BooleanField(default=False)
    thumbnail = models.ImageField(upload_to=curso_thumbnail_upload_path, blank=True, null=True)
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cursos_criados",
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField(TagCurso, blank=True, related_name="cursos")
    instrutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cursos_instruidos",
        verbose_name="Instrutor",
    )

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Curso"
        verbose_name_plural = "Cursos"

    def __str__(self):
        return self.titulo

    def save(self, *args, **kwargs):
        self.publicado = self.status == self.STATUS_PUBLICADO
        super().save(*args, **kwargs)

    @property
    def esta_publicado(self):
        return self.status == self.STATUS_PUBLICADO


class CursoParticipante(models.Model):
    """Participantes opcionais exibidos no curso (texto livre)."""
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="participantes")
    nome = models.CharField(max_length=200)
    cargo = models.CharField(max_length=120, blank=True, default="")
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem", "id"]
        verbose_name = "Participante do curso"
        verbose_name_plural = "Participantes do curso"

    def __str__(self):
        return self.nome


class CursoMaterial(models.Model):
    """Material de apoio do curso (PDF opcional)."""
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="materiais")
    titulo = models.CharField(max_length=200)
    arquivo = models.FileField(upload_to=curso_material_upload_path, blank=True, null=True)
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem", "id"]
        verbose_name = "Material do curso"
        verbose_name_plural = "Materiais do curso"

    def __str__(self):
        return self.titulo

    @property
    def arquivo_url(self):
        if self.arquivo:
            return self.arquivo.url
        return None


class Modulo(models.Model):
    TIPO_TEXTO = "texto"
    TIPO_APOSTILA = "apostila"
    TIPO_VIDEO = "video"
    TIPO_CHOICES = [
        (TIPO_TEXTO, "O que você vai aprender"),
        (TIPO_APOSTILA, "Apostilas"),
        (TIPO_VIDEO, "Videoaulas"),
    ]

    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="modulos")
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_VIDEO)
    conteudo_texto = models.TextField(blank=True, default="")
    ordem = models.PositiveIntegerField(default=0)
    duracao_minutos = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Módulo"
        verbose_name_plural = "Módulos"

    def __str__(self):
        return self.titulo


class ModuloArquivo(models.Model):
    TIPO_PDF = "pdf"
    TIPO_AUDIO = "audio"
    TIPO_CHOICES = [
        (TIPO_PDF, "PDF"),
        (TIPO_AUDIO, "Áudio"),
    ]

    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="arquivos")
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default=TIPO_PDF)
    arquivo = models.FileField(upload_to=modulo_arquivo_upload_path, blank=True, null=True)
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Arquivo do módulo"
        verbose_name_plural = "Arquivos do módulo"

    def __str__(self):
        return self.titulo

    @property
    def arquivo_url(self):
        if self.arquivo:
            return self.arquivo.url
        return None


class AulaVideo(models.Model):
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="aulas")
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    video = models.FileField(upload_to=aula_video_upload_path, blank=True, null=True)
    duracao_segundos = models.PositiveIntegerField(default=0)
    ordem = models.PositiveIntegerField(default=0)
    obrigatoria = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Aula em vídeo"
        verbose_name_plural = "Aulas em vídeo"

    def __str__(self):
        return self.titulo

    @property
    def video_url(self):
        if self.video:
            return self.video.url
        return None


class Atividade(models.Model):
    TIPO_QUIZ = "quiz"
    TIPO_REFLEXAO = "reflexao"
    TIPO_CHOICES = [
        (TIPO_QUIZ, "Quiz"),
        (TIPO_REFLEXAO, "Reflexão"),
    ]

    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="atividades")
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_QUIZ)
    ordem = models.PositiveIntegerField(default=0)
    obrigatoria = models.BooleanField(default=True)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Atividade"
        verbose_name_plural = "Atividades"


class ProvaFinal(models.Model):
    curso = models.OneToOneField(Curso, on_delete=models.CASCADE, related_name="prova_final")
    titulo = models.CharField(max_length=200, default="Prova final")
    nota_minima = models.PositiveSmallIntegerField(default=70)
    tentativas_max = models.PositiveSmallIntegerField(default=3)
    tempo_limite_min = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Prova final"
        verbose_name_plural = "Provas finais"


class Questao(models.Model):
    TIPO_MULTIPLA = "multipla_escolha"
    TIPO_VF = "verdadeiro_falso"
    TIPO_CHOICES = [
        (TIPO_MULTIPLA, "Múltipla escolha"),
        (TIPO_VF, "Verdadeiro ou falso"),
    ]

    atividade = models.ForeignKey(
        Atividade, null=True, blank=True, on_delete=models.CASCADE, related_name="questoes"
    )
    prova = models.ForeignKey(
        ProvaFinal, null=True, blank=True, on_delete=models.CASCADE, related_name="questoes"
    )
    enunciado = models.TextField()
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, default=TIPO_MULTIPLA)
    opcoes = models.JSONField(default=list, blank=True)
    resposta_correta = models.JSONField(default=dict, blank=True)
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Questão"
        verbose_name_plural = "Questões"


class Matricula(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="matriculas"
    )
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="matriculas")
    progresso = models.PositiveSmallIntegerField(default=0)
    nota_final = models.PositiveSmallIntegerField(null=True, blank=True)
    certificado_liberado = models.BooleanField(default=False)
    concluido_em = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["usuario", "curso"]]
        verbose_name = "Matrícula"
        verbose_name_plural = "Matrículas"


class ProgressoAula(models.Model):
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name="progresso_aulas")
    aula = models.ForeignKey(AulaVideo, on_delete=models.CASCADE, related_name="progressos")
    concluida = models.BooleanField(default=False)
    concluida_em = models.DateTimeField(null=True, blank=True)
    # Máximo de segundos válidos assistidos em sequência (anti-pulo)
    segundos_assistidos = models.FloatField(default=0)

    class Meta:
        unique_together = [["matricula", "aula"]]
        verbose_name = "Progresso de aula"
        verbose_name_plural = "Progressos de aula"


class ProgressoModuloTexto(models.Model):
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name="progresso_modulos_texto")
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE, related_name="progressos_texto")
    concluida = models.BooleanField(default=False)
    concluida_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [["matricula", "modulo"]]
        verbose_name = "Progresso de módulo texto"
        verbose_name_plural = "Progressos de módulo texto"


class ProgressoModuloArquivo(models.Model):
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name="progresso_modulos_arquivo")
    arquivo = models.ForeignKey(ModuloArquivo, on_delete=models.CASCADE, related_name="progressos")
    concluida = models.BooleanField(default=False)
    concluida_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [["matricula", "arquivo"]]
        verbose_name = "Progresso de arquivo do módulo"
        verbose_name_plural = "Progressos de arquivo do módulo"


class TentativaAtividade(models.Model):
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name="tentativas_atividade")
    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="tentativas")
    nota = models.PositiveSmallIntegerField(default=0)
    aprovado = models.BooleanField(default=False)
    respostas = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tentativa de atividade"
        verbose_name_plural = "Tentativas de atividade"


class TentativaProva(models.Model):
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name="tentativas_prova")
    prova = models.ForeignKey(ProvaFinal, on_delete=models.CASCADE, related_name="tentativas")
    nota = models.PositiveSmallIntegerField(default=0)
    aprovado = models.BooleanField(default=False)
    respostas = models.JSONField(default=dict, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tentativa de prova"
        verbose_name_plural = "Tentativas de prova"


class TreinamentoAoVivo(models.Model):
    TIPO_MEET = "meet"
    TIPO_YOUTUBE = "youtube"
    TIPO_PLATAFORMA_CHOICES = [
        (TIPO_MEET, "Google Meet"),
        (TIPO_YOUTUBE, "YouTube Live"),
    ]

    titulo = models.CharField(max_length=200)
    data = models.DateField()
    hora = models.TimeField()
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="treinamentos"
    )
    descricao = models.TextField(blank=True)
    tipo_plataforma = models.CharField(
        max_length=20,
        choices=TIPO_PLATAFORMA_CHOICES,
        default=TIPO_MEET,
    )
    link = models.URLField(max_length=500, blank=True)
    tags = models.ManyToManyField("TagCurso", blank=True, related_name="treinamentos_ao_vivo")

    class Meta:
        ordering = ["data", "hora"]
        verbose_name = "Treinamento ao vivo"
        verbose_name_plural = "Treinamentos ao vivo"


class Comunicado(models.Model):
    TIPO_INFO = "info"
    TIPO_TROFEU = "trofeu"
    TIPO_MEGAFONE = "megafone"
    TIPO_CHOICES = [
        (TIPO_INFO, "Informação"),
        (TIPO_TROFEU, "Conquista"),
        (TIPO_MEGAFONE, "Aviso"),
    ]

    titulo = models.CharField(max_length=200)
    conteudo = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_INFO)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Comunicado"
        verbose_name_plural = "Comunicados"


class Certificado(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificados"
    )
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="certificados")
    emitido_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["usuario", "curso"]]
        verbose_name = "Certificado"
        verbose_name_plural = "Certificados"


class Conquista(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conquistas"
    )
    slug = models.SlugField()
    titulo = models.CharField(max_length=100)
    emitido_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["usuario", "slug"]]
        verbose_name = "Conquista"
        verbose_name_plural = "Conquistas"


def biblioteca_upload_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    uid = instance.pk or uuid.uuid4().hex[:12]
    return f"biblioteca/{uid}.{ext}"


class MaterialBiblioteca(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    arquivo = models.FileField(upload_to=biblioteca_upload_path, blank=True, null=True)
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="materiais"
    )
    publicado = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Material da biblioteca"
        verbose_name_plural = "Materiais da biblioteca"

    @property
    def arquivo_url(self):
        if self.arquivo:
            return self.arquivo.url
        return None


class InscricaoAoVivo(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inscricoes_ao_vivo"
    )
    treinamento = models.ForeignKey(
        TreinamentoAoVivo, on_delete=models.CASCADE, related_name="inscricoes"
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["usuario", "treinamento"]]
        verbose_name = "Inscrição ao vivo"
        verbose_name_plural = "Inscrições ao vivo"


class ComunicadoLeitura(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comunicados_lidos"
    )
    comunicado = models.ForeignKey(
        Comunicado, on_delete=models.CASCADE, related_name="leituras"
    )
    lido_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["usuario", "comunicado"]]
        verbose_name = "Leitura de comunicado"
        verbose_name_plural = "Leituras de comunicados"
