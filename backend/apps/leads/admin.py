from django.contrib import admin
from django.utils.html import format_html, format_html_join
import csv
from django.http import HttpResponse
from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    SIMULATION_SECTIONS = (
        ("Financement", (
            ("apartment_price", "Prix du logement", "fcfa"),
            ("down_payment", "Apport personnel", "fcfa"),
            ("loan_amount", "Montant à financer", "fcfa"),
            ("monthly_payment", "Mensualité estimée", "fcfa"),
            ("duration_years", "Durée du prêt", "years"),
            ("interest_rate", "Taux annuel", "percent"),
            ("loan_to_value_percent", "Part financée par le prêt", "percent"),
        )),
        ("Revenus locatifs", (
            ("rental_occupied_days", "Jours de location estimés par mois", "days"),
            ("rental_daily_rate_eur", "Tarif journalier", "eur"),
            ("rental_gross_income_eur", "Revenu locatif brut", "eur"),
            ("rental_structure_share_eur", "Part de gestion", "eur"),
            ("rental_owner_income_eur", "Revenu propriétaire estimé", "eur"),
            ("rental_owner_income", "Revenu propriétaire estimé", "fcfa"),
            ("rental_recognition_rate", "Part des revenus locatifs retenue", "ratio"),
            ("rental_recognized_income", "Revenu locatif retenu", "fcfa"),
            ("rental_property_charges", "Charges du logement", "fcfa"),
            ("rental_cash_flow", "Cash-flow locatif estimé", "fcfa"),
            ("rental_effort", "Effort mensuel après loyers", "fcfa"),
        )),
        ("Revenus et solvabilité", (
            ("personal_income", "Revenus personnels mensuels", "fcfa"),
            ("monthly_income", "Revenus mensuels retenus", "fcfa"),
            ("existing_loans", "Crédits mensuels existants", "fcfa"),
            ("total_monthly_commitment", "Engagements mensuels totaux", "fcfa"),
            ("available_monthly_income", "Revenu disponible estimé", "fcfa"),
            ("recommended_monthly_budget", "Budget mensuel recommandé", "fcfa"),
            ("debt_ratio_percent", "Taux d’endettement estimé", "percent"),
            ("debt_ratio_threshold", "Seuil d’endettement", "percent"),
            ("debt_ratio_gap", "Dépassement du seuil", "percent"),
            ("minimum_income_required", "Revenu minimum requis", "fcfa"),
            ("living_expenses", "Dépenses de vie estimées", "fcfa"),
            ("remaining_income", "Reste à vivre estimé", "fcfa"),
            ("is_debt_ratio_healthy", "Taux d’endettement dans le seuil", "boolean"),
        )),
    )

    list_display = (
        'created_at',
        'first_name', 
        'last_name', 
        'phone_whatsapp', 
        'email', 
        'residence_country',
        'project_purpose',
        'pipeline_stage', 
        'interested_apartment', 
        'utm_source',
        'follow_up_count'
    )
    list_filter = ('pipeline_stage', 'project_purpose', 'utm_source', 'residence_country', 'consent_marketing', 'created_at')
    search_fields = ('first_name', 'last_name', 'phone_whatsapp', 'email', 'notes')
    list_editable = ('pipeline_stage',)
    readonly_fields = ('created_at', 'updated_at', 'utm_source', 'utm_medium', 'utm_campaign', 'simulation_summary', 'ai_conversation_summary')
   
    fieldsets = (
        ("État Civil & Contact", {
            'fields': ('first_name', 'last_name', 'phone_whatsapp', 'email', 'residence_country', 'age', 'employment_status', 'professional_seniority_years')
        }),
        ("Projet Diaspora", {
            'fields': ('project_purpose', 'funds_availability')
        }),
        ("Pipeline Commercial & Suivi", {
            'fields': ('pipeline_stage', 'interested_apartment', 'interested_apartment_ref', 'interested_apartment_price', 'follow_up_count', 'notes')
        }),
        ("Capacité Financière & Simulation", {
            'fields': ('monthly_net_income', 'has_co_borrower', 'co_borrower_monthly_income', 'additional_monthly_income', 'down_payment', 'existing_monthly_loans', 'desired_duration_years', 'simulation_summary', 'ai_conversation_summary')
        }),
        ("Attribution Campagnes & UTM", {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign')
        }),
        ("Consentements & Conformité", {
            'fields': ('consent_data_processing', 'consent_marketing', 'created_at', 'updated_at')
        }),
    )

    actions = ['mark_as_qualified', 'mark_as_contacted', 'mark_as_meeting_scheduled', 'mark_as_reserved', 'export_csv']

    @admin.display(description="Résumé de la simulation")
    def simulation_summary(self, obj):
        data = obj.simulation_data
        if not isinstance(data, dict) or not data:
            return "Aucune donnée de simulation enregistrée."

        def display_value(value, kind):
            if kind == "boolean":
                return "Oui" if value else "Non"
            if isinstance(value, bool):
                return "Oui" if value else "Non"
            if isinstance(value, (int, float)):
                if kind == "fcfa":
                    return f"{value:,.0f}".replace(",", " ") + " FCFA"
                if kind == "eur":
                    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " €"
                if kind == "percent":
                    return f"{value:g} %"
                if kind == "ratio":
                    return f"{value * 100:g} %"
                if kind == "years":
                    return f"{value:g} an(s)"
                if kind == "days":
                    return f"{value:g} jours"
                return f"{value:g}"
            return str(value)

        rendered_sections = []
        known_keys = set()
        for title, fields in self.SIMULATION_SECTIONS:
            rows = []
            for key, label, kind in fields:
                if key in data:
                    known_keys.add(key)
                    rows.append((label, display_value(data[key], kind)))
            if rows:
                rendered_sections.append(format_html(
                    '<section style="margin:0 0 16px;padding:12px 16px;background:#f8fafc;border:1px solid #dbe2ea;border-radius:6px;">'
                    '<h3 style="margin:0 0 10px;font-size:14px;">{}</h3>'
                    '<dl style="display:grid;grid-template-columns:minmax(180px, 1fr) minmax(120px, 1fr);gap:8px 16px;margin:0;">{}</dl>'
                    '</section>',
                    title,
                    format_html_join(
                        "",
                        '<dt style="margin:0;color:#52606d;">{}</dt><dd style="margin:0;font-weight:600;">{}</dd>',
                        rows,
                    ),
                ))

        extra_rows = [
            (key.replace("_", " ").capitalize(), display_value(value, ""))
            for key, value in data.items()
            if key not in known_keys
        ]
        if extra_rows:
            rendered_sections.append(format_html(
                '<details style="margin:0 0 12px;"><summary style="cursor:pointer;font-weight:600;">Autres données</summary>'
                '<dl style="display:grid;grid-template-columns:minmax(180px, 1fr) minmax(120px, 1fr);gap:8px 16px;margin:12px 0 0;">{}</dl></details>',
                format_html_join(
                    "",
                    '<dt style="margin:0;color:#52606d;">{}</dt><dd style="margin:0;overflow-wrap:anywhere;">{}</dd>',
                    extra_rows,
                ),
            ))

        return format_html("{}", format_html_join("", "{}", ((section,) for section in rendered_sections)))

    @admin.action(description="Exporter les prospects sélectionnés en CSV")
    def export_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="prospects-noema.csv"'
        response.write('\ufeff')
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Créé le', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Pays',
            'Objectif', 'Appartement', 'Statut', 'Source UTM', 'Campagne UTM',
            'Revenus mensuels', 'Apport', 'Consentement traitement', 'Consentement marketing'
        ])
        for lead in queryset.select_related('interested_apartment'):
            writer.writerow([
                lead.id, lead.created_at.isoformat(), lead.first_name, lead.last_name,
                lead.email, lead.phone_whatsapp, lead.residence_country,
                lead.project_purpose, lead.interested_apartment_ref or getattr(lead.interested_apartment, 'reference', ''),
                lead.get_pipeline_stage_display(), lead.utm_source, lead.utm_campaign,
                lead.monthly_net_income, lead.down_payment,
                lead.consent_data_processing, lead.consent_marketing
            ])
        return response

    @admin.action(description="Passer en statut: Qualifié")
    def mark_as_qualified(self, request, queryset):
        queryset.update(pipeline_stage='qualified')

    @admin.action(description="Passer en statut: Contacté")
    def mark_as_contacted(self, request, queryset):
        queryset.update(pipeline_stage='contacted')

    @admin.action(description="Passer en statut: RDV planifié")
    def mark_as_meeting_scheduled(self, request, queryset):
        queryset.update(pipeline_stage='meeting_scheduled')

    @admin.action(description="Passer en statut: Réservation")
    def mark_as_reserved(self, request, queryset):
        queryset.update(pipeline_stage='reserved')
