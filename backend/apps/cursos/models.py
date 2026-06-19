"""Modelos da plataforma de cursos."""
from django.conf import settings
from django.db import models


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
    setor = models.ForeignKey(Setor, on_delete=models.CASCADE, related_name="trilhas")
    titulo = models.CharField(max_length=200)

    class Meta:
        verbose_name = "Trilha"
        verbose_name_plural = "Trilhas"

    def __str__(self):
        return self.titulo


class Curso(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    trilha = models.ForeignKey(
        Trilha, null=True, blank=True, on_delete=models.SET_NULL, related_name="cursos"
    )
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="cursos"
    )
    duracao_horas = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    total_modulos = models.PositiveIntegerField(default=0)
    is_novo = models.BooleanField(default=False)
    publicado = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Curso"
        verbose_name_plural = "Cursos"

    def __str__(self):
        return self.titulo


class Modulo(models.Model):
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="modulos")
    titulo = models.CharField(max_length=200)
    ordem = models.PositiveIntegerField(default=0)
    duracao_minutos = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]
        verbose_name = "Módulo"
        verbose_name_plural = "Módulos"


class Matricula(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="matriculas"
    )
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE, related_name="matriculas")
    progresso = models.PositiveSmallIntegerField(default=0)
    concluido_em = models.DateTimeField(null=True, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["usuario", "curso"]]
        verbose_name = "Matrícula"
        verbose_name_plural = "Matrículas"


class TreinamentoAoVivo(models.Model):
    titulo = models.CharField(max_length=200)
    data = models.DateField()
    hora = models.TimeField()
    setor = models.ForeignKey(
        Setor, null=True, blank=True, on_delete=models.SET_NULL, related_name="treinamentos"
    )
    descricao = models.TextField(blank=True)

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
