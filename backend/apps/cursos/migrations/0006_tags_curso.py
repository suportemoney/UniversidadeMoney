# Tags de curso e vínculo M2M com Curso

from django.db import migrations, models


def seed_tags_exemplo(apps, schema_editor):
    TagCurso = apps.get_model("cursos", "TagCurso")
    tags = [
        ("Vendas", "vendas"),
        ("Compliance", "compliance"),
        ("Onboarding", "onboarding"),
    ]
    for nome, slug in tags:
        TagCurso.objects.get_or_create(slug=slug, defaults={"nome": nome, "ativo": True})


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0005_biblioteca_inscricao_comunicado_leitura"),
    ]

    operations = [
        migrations.CreateModel(
            name="TagCurso",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=80, unique=True)),
                ("slug", models.SlugField(unique=True)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Tag de curso",
                "verbose_name_plural": "Tags de curso",
                "ordering": ["nome"],
            },
        ),
        migrations.AddField(
            model_name="curso",
            name="tags",
            field=models.ManyToManyField(blank=True, related_name="cursos", to="cursos.tagcurso"),
        ),
        migrations.RunPython(seed_tags_exemplo, migrations.RunPython.noop),
    ]
