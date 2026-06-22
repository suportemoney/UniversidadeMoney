from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0007_ao_vivo_tags"),
    ]

    operations = [
        migrations.AddField(
            model_name="treinamentoaovivo",
            name="tipo_plataforma",
            field=models.CharField(
                choices=[("meet", "Google Meet"), ("youtube", "YouTube Live")],
                default="meet",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="treinamentoaovivo",
            name="link",
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
