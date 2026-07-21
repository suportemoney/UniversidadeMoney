"""Seed do curso Operações SIAPE: descrição, 1 módulo, 4 aulas, atividade e prova."""
from django.core.management.base import BaseCommand

from apps.cursos.models import Atividade, AulaVideo, Curso, Modulo, ProvaFinal, Questao
from apps.cursos.services import recalcular_curso

CURSO_TITULO = "Operações SIAPE"

DESCRICAO = (
    "Curso prático para quem atende e opera no fluxo SIAPE na Money Promotora. "
    "Você vai entender o que é o SIAPE, como ler margem e rubricas, o passo a passo "
    "de uma consignação segura e os cuidados para evitar retrabalho e risco operacional.\n\n"
    "Ao final, faça a atividade do módulo e a prova do curso para consolidar o aprendizado."
)

MODULO_TITULO = "Fundamentos de Operações SIAPE"

AULAS = [
    {
        "titulo": "O que é o SIAPE e o papel da Money",
        "descricao": "Visão geral do SIAPE, consignação e como o atendimento da Money se encaixa nesse ecossistema.",
        "ordem": 1,
    },
    {
        "titulo": "Margem consignável e facultativa",
        "descricao": "Como interpretar margem, o que é facultativa e como explicar isso com clareza ao cliente.",
        "ordem": 2,
    },
    {
        "titulo": "Passo a passo da operação no SIAPE",
        "descricao": "Fluxo operacional do pedido à averbação: dados, conferências e pontos de atenção.",
        "ordem": 3,
    },
    {
        "titulo": "Erros comuns e boas práticas no atendimento",
        "descricao": "Falhas frequentes, como evitar pendências e checklist rápido antes de finalizar a operação.",
        "ordem": 4,
    },
]

ATIVIDADE_TITULO = "Quiz — Fundamentos SIAPE"

QUESTOES_ATIVIDADE = [
    {
        "enunciado": "No contexto da Money, o SIAPE está mais relacionado a:",
        "opcoes": [
            "Gestão de servidores públicos e consignações em folha",
            "Controle de estoque da loja",
            "Emissão de nota fiscal de produto",
            "Cadastro de fornecedores PJ",
        ],
        "valor": 0,
        "ordem": 1,
    },
    {
        "enunciado": "A margem facultativa, em termos práticos, indica:",
        "opcoes": [
            "O salário bruto integral do servidor",
            "A faixa ainda disponível para novos descontos consignados",
            "A taxa de juros do contrato",
            "O número de parcelas já quitadas",
        ],
        "valor": 1,
        "ordem": 2,
    },
    {
        "enunciado": "Antes de concluir uma operação no SIAPE, o colaborador deve principalmente:",
        "opcoes": [
            "Ignorar a margem se o cliente pedir urgência",
            "Conferir dados, margem e elegibilidade com atenção",
            "Alterar a rubrica sem registro",
            "Pular a validação de documentos",
        ],
        "valor": 1,
        "ordem": 3,
    },
    {
        "enunciado": "Uma boa prática no atendimento consignado é:",
        "opcoes": [
            "Prometer aprovação sem checar margem",
            "Explicar limites e próximos passos com transparência",
            "Usar dados de outro cliente para agilizar",
            "Finalizar sem confirmar identidade",
        ],
        "valor": 1,
        "ordem": 4,
    },
]

PROVA_TITULO = "Prova final — Operações SIAPE"

QUESTOES_PROVA = [
    {
        "enunciado": "Qual é o objetivo principal de operar com atenção à margem no SIAPE?",
        "opcoes": [
            "Aumentar o tempo de atendimento",
            "Garantir que o desconto caiba na folha e reduzir risco de indeferimento",
            "Substituir o cadastro do cliente",
            "Emitir certificado do curso automaticamente",
        ],
        "valor": 1,
        "ordem": 1,
    },
    {
        "enunciado": "Verdadeiro ou falso: a margem facultativa é o total do salário líquido do servidor.",
        "tipo": Questao.TIPO_VF,
        "opcoes": ["Verdadeiro", "Falso"],
        "valor": 1,  # Falso
        "ordem": 2,
    },
    {
        "enunciado": "No fluxo operacional, a conferência de dados do servidor deve ocorrer:",
        "opcoes": [
            "Somente depois da averbação",
            "Antes de avançar a proposta, para evitar retrabalho",
            "Apenas se o cliente reclamar",
            "Somente no fim do mês",
        ],
        "valor": 1,
        "ordem": 3,
    },
    {
        "enunciado": "Um erro comum que gera pendência na operação é:",
        "opcoes": [
            "Validar documentos e margem antes de enviar",
            "Informar dados inconsistentes ou incompletos no pedido",
            "Explicar o produto com clareza",
            "Registrar o atendimento corretamente",
        ],
        "valor": 1,
        "ordem": 4,
    },
    {
        "enunciado": "Ao orientar o cliente sobre consignado, o colaborador deve:",
        "opcoes": [
            "Omitir informações sobre limites de margem",
            "Esclarecer condições, prazos e o que depende de análise/averbação",
            "Garantir aprovação imediata em todos os casos",
            "Pedir senha do banco do cliente",
        ],
        "valor": 1,
        "ordem": 5,
    },
]


class Command(BaseCommand):
    help = (
        "Configura o curso 'Operações SIAPE': descrição, 1 módulo com 4 videoaulas "
        "(sem arquivo), atividade quiz e prova final (idempotente)."
    )

    def handle(self, *args, **options):
        curso = Curso.objects.filter(titulo__iexact=CURSO_TITULO).order_by("id").first()
        if not curso:
            curso = Curso.objects.filter(titulo__icontains="Operações SIAPE").order_by("id").first()
        if not curso:
            self.stderr.write(self.style.ERROR(f'Curso "{CURSO_TITULO}" não encontrado.'))
            return

        curso.descricao = DESCRICAO
        curso.save(update_fields=["descricao", "atualizado_em"])
        self.stdout.write(self.style.SUCCESS(f"Descrição atualizada (curso id={curso.id})."))

        modulo, mod_created = Modulo.objects.get_or_create(
            curso=curso,
            titulo=MODULO_TITULO,
            defaults={
                "tipo": Modulo.TIPO_VIDEO,
                "ordem": 1,
            },
        )
        if not mod_created:
            modulo.tipo = Modulo.TIPO_VIDEO
            if modulo.ordem != 1:
                modulo.ordem = 1
            modulo.save(update_fields=["tipo", "ordem"])
        self.stdout.write(
            self.style.SUCCESS(f"Módulo {'criado' if mod_created else 'já existia'}: {modulo.titulo}")
        )

        for meta in AULAS:
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
            if not created:
                changed = False
                if aula.ordem != meta["ordem"]:
                    aula.ordem = meta["ordem"]
                    changed = True
                if (aula.descricao or "") != meta["descricao"]:
                    aula.descricao = meta["descricao"]
                    changed = True
                if changed:
                    aula.save(update_fields=["ordem", "descricao"])
            self.stdout.write(
                self.style.SUCCESS(f"  Aula {'criada' if created else 'ok'}: {aula.titulo}")
            )

        atividade, ativ_created = Atividade.objects.get_or_create(
            modulo=modulo,
            titulo=ATIVIDADE_TITULO,
            defaults={
                "tipo": Atividade.TIPO_QUIZ,
                "ordem": 1,
                "obrigatoria": True,
            },
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Atividade {'criada' if ativ_created else 'já existia'}: {atividade.titulo}"
            )
        )
        for qmeta in QUESTOES_ATIVIDADE:
            self._ensure_questao(atividade=atividade, prova=None, qmeta=qmeta)

        prova, prova_created = ProvaFinal.objects.get_or_create(
            curso=curso,
            defaults={
                "titulo": PROVA_TITULO,
                "nota_minima": 70,
                "tentativas_max": 3,
                "tempo_limite_min": 30,
            },
        )
        if not prova_created:
            prova.titulo = PROVA_TITULO
            prova.nota_minima = 70
            prova.tentativas_max = 3
            if not prova.tempo_limite_min:
                prova.tempo_limite_min = 30
            prova.save(
                update_fields=["titulo", "nota_minima", "tentativas_max", "tempo_limite_min"]
            )
        self.stdout.write(
            self.style.SUCCESS(f"Prova {'criada' if prova_created else 'atualizada'}: {prova.titulo}")
        )
        for qmeta in QUESTOES_PROVA:
            self._ensure_questao(atividade=None, prova=prova, qmeta=qmeta)

        recalcular_curso(curso)
        self.stdout.write(
            self.style.SUCCESS(
                "Concluído. Faça o upload dos 4 vídeos no painel "
                f"(curso id={curso.id}, módulo id={modulo.id})."
            )
        )

    def _ensure_questao(self, *, atividade, prova, qmeta):
        tipo = qmeta.get("tipo", Questao.TIPO_MULTIPLA)
        defaults = {
            "tipo": tipo,
            "opcoes": qmeta["opcoes"],
            "resposta_correta": {"valor": qmeta["valor"]},
            "ordem": qmeta["ordem"],
        }
        lookup = {"enunciado": qmeta["enunciado"]}
        if atividade is not None:
            lookup["atividade"] = atividade
            lookup["prova"] = None
        else:
            lookup["prova"] = prova
            lookup["atividade"] = None

        q, created = Questao.objects.get_or_create(**lookup, defaults=defaults)
        if not created:
            q.tipo = tipo
            q.opcoes = qmeta["opcoes"]
            q.resposta_correta = {"valor": qmeta["valor"]}
            q.ordem = qmeta["ordem"]
            q.save(update_fields=["tipo", "opcoes", "resposta_correta", "ordem"])
        destino = "atividade" if atividade else "prova"
        self.stdout.write(
            f"  [{destino}] Q{qmeta['ordem']} {'criada' if created else 'ok'}"
        )
