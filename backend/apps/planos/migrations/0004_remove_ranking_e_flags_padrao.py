# Remove flags de módulos padrão e ranking do plano

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("planos", "0003_plano_tags_cursos"),
    ]

    operations = [
        migrations.RemoveField(model_name="plano", name="acesso_ranking"),
        migrations.RemoveField(model_name="plano", name="acesso_biblioteca"),
        migrations.RemoveField(model_name="plano", name="acesso_certificados"),
        migrations.RemoveField(model_name="plano", name="acesso_comunicados"),
        migrations.RemoveField(model_name="plano", name="acesso_progresso"),
    ]
