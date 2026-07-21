from django.core.management.base import BaseCommand

from apps.cursos.models import Atividade, AulaVideo, Curso, Questao
from apps.cursos.services import recalcular_curso


CURSO_TITULO = "Primeiros passos na Money"

AULAS_EXTRA = [
    {
        "titulo": "Conhecendo o SIAPE",
        "descricao": "Entenda o que é o SIAPE e como ele aparece no dia a dia da Money.",
        "ordem": 2,
    },
    {
        "titulo": "Margem facultativa na prática",
        "descricao": "Como identificar e explicar a margem facultativa no atendimento.",
        "ordem": 3,
    },
]

ATIVIDADE_TITULO = "Quiz do Módulo 1 — SIAPE e margem"

QUESTOES = [
    {
        "enunciado": "No contexto da Money, o SIAPE está relacionado principalmente a:",
        "opcoes": [
            "Sistema de gestão de servidores públicos e consignações",
            "Software interno de RH da Money",
            "Plataforma de vídeos da universidade",
            "Cadastro de clientes pessoa jurídica",
        ],
        "valor": 0,
        "ordem": 1,
    },
    {
        "enunciado": "A margem facultativa representa:",
        "opcoes": [
            "O valor total do salário bruto do servidor",
            "A parcela da margem disponível para novos descontos consignados",
            "A taxa de juros do contrato",
            "O número de parcelas já pagas",
        ],
        "valor": 1,
        "ordem": 2,
    },
    {
        "enunciado": "Por que o colaborador precisa conhecer a margem facultativa no atendimento?",
        "opcoes": [
            "Para emitir certificado do curso",
            "Para orientar o cliente com segurança sobre o que ainda cabe no consignado",
            "Para alterar o SIAPE do cliente",
            "Para liberar a prova final automaticamente",
        ],
        "valor": 1,
        "ordem": 3,
    },
]


class Command(BaseCommand):
    help = (
        "Adiciona 2 videoaulas (sem arquivo) e 1 atividade quiz no Módulo 1 "
        "do curso 'Primeiros passos na Money' (idempotente)."
    )

    def handle(self, *args, **options):
        curso = Curso.objects.filter(titulo=CURSO_TITULO).order_by("id").first()
        if not curso:
            self.stderr.write(self.style.ERROR(f'Curso "{CURSO_TITULO}" não encontrado.'))
            return

        modulo = curso.modulos.order_by("ordem", "id").first()
        if not modulo:
            self.stderr.write(self.style.ERROR("Curso sem módulos."))
            return

        criadas = 0
        for meta in AULAS_EXTRA:
            aula, created = AulaVideo.objects.get_or_create(
                modulo=modulo,
                titulo=meta["titulo"],
                defaults={
                    "descricao": meta["descricao"],
                    "ordem": meta["ordem"],
                    "obrigatoria": True,
                    "duracao_segundos": 0,
                },
            )
            if not created and aula.ordem != meta["ordem"]:
                aula.ordem = meta["ordem"]
                aula.descricao = meta["descricao"] or aula.descricao
                aula.save(update_fields=["ordem", "descricao"])
            if created:
                criadas += 1
                self.stdout.write(self.style.SUCCESS(f"Aula criada: {aula.titulo}"))
            else:
                self.stdout.write(f"Aula já existia: {aula.titulo}")

        atividade, ativ_created = Atividade.objects.get_or_create(
            modulo=modulo,
            titulo=ATIVIDADE_TITULO,
            defaults={
                "tipo": Atividade.TIPO_QUIZ,
                "ordem": 1,
                "obrigatoria": True,
            },
        )
        if ativ_created:
            self.stdout.write(self.style.SUCCESS(f"Atividade criada: {atividade.titulo}"))
        else:
            self.stdout.write(f"Atividade já existia: {atividade.titulo}")

        for qmeta in QUESTOES:
            q, q_created = Questao.objects.get_or_create(
                atividade=atividade,
                enunciado=qmeta["enunciado"],
                defaults={
                    "tipo": Questao.TIPO_MULTIPLA,
                    "opcoes": qmeta["opcoes"],
                    "resposta_correta": {"valor": qmeta["valor"]},
                    "ordem": qmeta["ordem"],
                },
            )
            if q_created:
                self.stdout.write(self.style.SUCCESS(f"  Questão {q.ordem} criada"))
            else:
                self.stdout.write(f"  Questão {q.ordem} já existia")

        recalcular_curso(curso)
        self.stdout.write(
            self.style.SUCCESS(
                f"Concluído. Módulo id={modulo.id}, curso id={curso.id}. "
                f"Aulas novas nesta execução: {criadas}. "
                "Faça upload dos vídeos no painel."
            )
        )
