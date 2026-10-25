from django.db import migrations


INITIAL_MILESTONES = (
    {
        "stage_number": 1,
        "title": "Études géotechniques, permis & Fondations spéciales",
        "description": "Validation des sondages de sol, obtention intégrale du Permis de Construire officiel et réalisation des pieux forés en béton armé.",
        "status": "in_progress",
        "progress_percent": 70,
        "date_display": "En cours — 70%",
        "is_3d_render": False,
        "display_order": 1,
    },
    {
        "stage_number": 2,
        "title": "Élévation de la structure Gros Œuvre (R+7)",
        "description": "Coulage des dalles et poteaux jusqu'au 8ème niveau. Respect strict des normes parasismiques et contrôles hebdomadaires de laboratoire agréé.",
        "status": "upcoming",
        "progress_percent": 0,
        "date_display": "À venir",
        "is_3d_render": False,
        "display_order": 2,
    },
    {
        "stage_number": 3,
        "title": "Maçonnerie, Cloisons & Réseaux techniques",
        "description": "Pose des briques, gainage électrique, plomberie multicouche, pré-câblage fibre optique et climatisation.",
        "status": "upcoming",
        "progress_percent": 0,
        "date_display": "À venir",
        "is_3d_render": False,
        "display_order": 3,
    },
    {
        "stage_number": 4,
        "title": "Façades épurées, Menuiseries & Finitions",
        "description": "Enduits extérieurs étanches haute durabilité, baies vitrées aluminium double vitrage et finitions premium haut de gamme.",
        "status": "upcoming",
        "progress_percent": 0,
        "date_display": "À venir",
        "is_3d_render": True,
        "display_order": 4,
    },
    {
        "stage_number": 5,
        "title": "Finitions intérieures & Livraison prévisionnelle",
        "description": "Carrelages grand format, sanitaires suspendus, menuiseries intérieures, essais d'équipements et remise solennelle des clés aux acquéreurs.",
        "status": "upcoming",
        "progress_percent": 0,
        "date_display": "À venir",
        "is_3d_render": True,
        "display_order": 5,
    },
)


def seed_initial_milestones(apps, schema_editor):
    milestone_model = apps.get_model("construction", "ConstructionMilestone")
    if milestone_model.objects.using(schema_editor.connection.alias).exists():
        return

    milestone_model.objects.using(schema_editor.connection.alias).bulk_create(
        milestone_model(**milestone) for milestone in INITIAL_MILESTONES
    )


class Migration(migrations.Migration):
    dependencies = [
        ("construction", "0002_set_first_milestone_progress"),
    ]

    operations = [
        migrations.RunPython(seed_initial_milestones, migrations.RunPython.noop),
    ]
