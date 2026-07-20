"""Dados iniciais da plataforma Money Promotora (usado pela migration 0002)."""
from datetime import date, time, timedelta


def seed_dados(apps, schema_editor):
    Setor = apps.get_model("cursos", "Setor")
    Trilha = apps.get_model("cursos", "Trilha")
    Curso = apps.get_model("cursos", "Curso")
    Modulo = apps.get_model("cursos", "Modulo")
    Comunicado = apps.get_model("cursos", "Comunicado")
    TreinamentoAoVivo = apps.get_model("cursos", "TreinamentoAoVivo")

    if Setor.objects.exists():
        return

    setores_data = [
        ("rh", "RH", "👥", 1),
        ("vendas", "Vendas", "💼", 2),
        ("ti", "TI", "💻", 3),
        ("marketing", "Marketing", "📣", 4),
        ("administrativo", "Administrativo", "📋", 5),
        ("inss", "INSS", "🏛️", 6),
        ("siape", "SIAPE", "🏦", 7),
    ]
    setores = {}
    for slug, nome, icone, ordem in setores_data:
        setores[slug] = Setor.objects.create(nome=nome, slug=slug, icone=icone, ordem=ordem)

    trilhas = {}
    for slug, setor in setores.items():
        trilhas[slug] = Trilha.objects.create(setor=setor, titulo=f"Trilha {setor.nome}")

    cursos_data = [
        ("Atendimento e Conversão", "vendas", 4, 8, False),
        ("Produtos INSS", "inss", 6, 12, False),
        ("Compliance e LGPD", "administrativo", 3, 6, True),
        ("Inteligência Artificial na Prática", "ti", 5, 10, True),
        ("Comunicação Assertiva", "rh", 2, 5, True),
        ("Operações SIAPE", "siape", 4, 8, False),
    ]
    for titulo, setor_slug, modulos, horas, is_novo in cursos_data:
        curso = Curso.objects.create(
            titulo=titulo,
            setor=setores[setor_slug],
            trilha=trilhas[setor_slug],
            total_modulos=modulos,
            duracao_horas=horas,
            is_novo=is_novo,
            publicado=True,
        )
        for i in range(1, modulos + 1):
            Modulo.objects.create(
                curso=curso,
                titulo=f"Módulo {i}",
                ordem=i,
                duracao_minutos=30 + i * 5,
            )

    Comunicado.objects.create(
        titulo="Nova trilha de Vendas disponível",
        conteudo="Confira os novos módulos de atendimento e conversão.",
        tipo="info",
    )
    Comunicado.objects.create(
        titulo="Parabéns aos destaques do mês!",
        conteudo="Colaboradores com maior evolução receberão reconhecimento especial.",
        tipo="trofeu",
    )
    Comunicado.objects.create(
        titulo="Treinamento ao vivo — Compliance",
        conteudo="Inscrições abertas para a próxima turma.",
        tipo="megafone",
    )

    hoje = date.today()
    # Campos tipo_plataforma/link só existem após migration 0008;
    # este seed roda na 0002 com modelo histórico.
    TreinamentoAoVivo.objects.create(
        titulo="Workshop de Vendas Consultivas",
        data=hoje + timedelta(days=3),
        hora=time(14, 0),
        setor=setores["vendas"],
    )
    TreinamentoAoVivo.objects.create(
        titulo="LGPD na Prática",
        data=hoje + timedelta(days=7),
        hora=time(10, 0),
        setor=setores["administrativo"],
    )


def unseed_dados(apps, schema_editor):
    pass
