from django.db import migrations, models


def create_construction_showcase(apps, schema_editor):
    showcase_model = apps.get_model("construction", "ConstructionShowcase")
    showcase_model.objects.using(schema_editor.connection.alias).get_or_create(
        pk=1,
        defaults={
            "title": "Élévation de la structure R+7",
            "caption": "Coulage des planchers & suivi des normes parasismiques",
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("construction", "0003_seed_initial_milestones"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConstructionShowcase",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        default="Élévation de la structure R+7",
                        max_length=200,
                        verbose_name="Libellé au-dessus de la photo",
                    ),
                ),
                (
                    "caption",
                    models.CharField(
                        default="Coulage des planchers & suivi des normes parasismiques",
                        max_length=250,
                        verbose_name="Légende de la photo",
                    ),
                ),
                (
                    "photo",
                    models.ImageField(
                        blank=True,
                        upload_to="construction/showcase/",
                        verbose_name="Photo principale du chantier",
                    ),
                ),
            ],
            options={
                "verbose_name": "Photo principale du chantier",
                "verbose_name_plural": "Photo principale du chantier",
            },
        ),
        migrations.RunPython(create_construction_showcase, migrations.RunPython.noop),
    ]
