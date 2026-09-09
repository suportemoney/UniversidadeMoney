"""Limpa catálogo (cursos, trilhas, comunicados, ao vivo) e cria Formação Comercial."""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.cursos.models import (
    AulaVideo,
    Comunicado,
    ComunicadoLeitura,
    Curso,
    InscricaoAoVivo,
    Modulo,
    TreinamentoAoVivo,
    Trilha,
)
from apps.cursos.services import recalcular_curso

CURSO_TITULO = "Formação Comercial"
CURSO_DESCRICAO = (
    "Um programa completo para conhecer a Money, entender nossa cultura, "
    "nossos processos e dominar os produtos."
)

MODULOS = [
    {
        "titulo": "Bem-vindo à Money",
        "aulas": [
            "Integração",
            "História da empresa",
            "Cultura",
            "Propósito",
            "Estrutura",
            "Apresentação da jornada do colaborador",
        ],
    },
    {
        "titulo": "Jeito Money de Trabalhar",
        "aulas": [
            "Regras",
            "Regulamentos",
            "Condutas",
            "Processos internos",
            "Responsabilidades",
            "Rotina",
            "Padrões da empresa",
        ],
    },
    {
        "titulo": "Academia de Produtos & Vendas",
        "aulas": [
            "Conhecimento dos produtos",
            "Público-alvo",
            "Abordagem",
            "Processo comercial",
            "Argumentação",
            "Negociação",
            "Fechamento",
        ],
    },
]


def _apagar_arquivo(campo):
    """Remove o arquivo do storage se existir."""
    if not campo:
        return
    try:
        campo.delete(save=False)
    except Exception:
        pass


class Command(BaseCommand):
    help = (
        "Apaga cursos, trilhas, comunicados e ao vivo e cria o curso "
        "Formação Comercial (rascunho, aulas sem vídeo)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirmar",
            action="store_true",
            help="Obrigatório: confirma a limpeza irreversível do catálogo.",
        )

    def handle(self, *args, **options):
        if not options["confirmar"]:
            self.stderr.write(
                self.style.ERROR("Use --confirmar para executar a limpeza do catálogo.")
            )
            return

        with transaction.atomic():
            n_leituras, _ = ComunicadoLeitura.objects.all().delete()
            n_comunicados, _ = Comunicado.objects.all().delete()
            n_inscricoes, _ = InscricaoAoVivo.objects.all().delete()
            n_ao_vivo, _ = TreinamentoAoVivo.objects.all().delete()

            n_cursos = Curso.objects.count()
            n_trilhas = Trilha.objects.count()
            for curso in Curso.objects.all():
                _apagar_arquivo(curso.thumbnail)
                for material in curso.materiais.all():
                    _apagar_arquivo(material.arquivo)
                for modulo in curso.modulos.all():
                    for arquivo in modulo.arquivos.all():
                        _apagar_arquivo(arquivo.arquivo)
                    for aula in modulo.aulas.all():
                        _apagar_arquivo(aula.video)
            Curso.objects.all().delete()
            Trilha.objects.all().delete()

            self.stdout.write(
                f"Removidos: {n_cursos} cursos, {n_trilhas} trilhas, "
                f"{n_comunicados} comunicados, {n_ao_vivo} ao vivo "
                f"({n_leituras} leituras, {n_inscricoes} inscrições)."
            )

            admin = User.objects.filter(is_superuser=True).order_by("id").first()
            curso = Curso.objects.create(
                titulo=CURSO_TITULO,
                descricao=CURSO_DESCRICAO,
                status=Curso.STATUS_RASCUNHO,
                is_novo=True,
                instrutor=admin,
                criado_por=admin,
            )
            for i, meta in enumerate(MODULOS, start=1):
                modulo = Modulo.objects.create(
                    curso=curso,
                    titulo=meta["titulo"],
                    tipo=Modulo.TIPO_VIDEO,
                    ordem=i,
                )
                for j, titulo_aula in enumerate(meta["aulas"], start=1):
                    AulaVideo.objects.create(
                        modulo=modulo,
                        titulo=titulo_aula,
                        ordem=j,
                        obrigatoria=True,
                        duracao_segundos=0,
                    )
                self.stdout.write(f"Módulo {i}: {modulo.titulo} ({len(meta['aulas'])} aulas)")

            recalcular_curso(curso)

        self.stdout.write(
            self.style.SUCCESS(
                f'Curso "{CURSO_TITULO}" criado (id={curso.id}, rascunho). '
                "Envie os vídeos no painel para publicar."
            )
        )
