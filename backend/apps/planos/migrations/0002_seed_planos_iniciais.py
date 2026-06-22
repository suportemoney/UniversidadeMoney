# Planos iniciais: Básico e Completo

from django.db import migrations


def criar_planos(apps, schema_editor):
    Plano = apps.get_model("planos", "Plano")
    if Plano.objects.exists():
        return
    Plano.objects.create(
        titulo="Básico",
        slug="basico",
        descricao="Acesso a cursos, certificados e progresso.",
        acesso_cursos=True,
        acesso_certificados=True,
        acesso_progresso=True,
    )
    Plano.objects.create(
        titulo="Completo",
        slug="completo",
        descricao="Acesso total à plataforma de aprendizado.",
        acesso_cursos=True,
        acesso_trilhas=True,
        acesso_biblioteca=True,
        acesso_ao_vivo=True,
        acesso_certificados=True,
        acesso_ranking=True,
        acesso_comunicados=True,
        acesso_progresso=True,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("planos", "0001_planos_tokens_assinaturas"),
    ]

    operations = [
        migrations.RunPython(criar_planos, migrations.RunPython.noop),
    ]
