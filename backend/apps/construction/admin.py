from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import ConstructionMilestone, ConstructionShowcase


def set_current_stage(milestone, previous_active_stages=None):
    if previous_active_stages is None:
        previous_active_stages = list(
            ConstructionMilestone.objects.filter(status="in_progress")
            .exclude(pk=milestone.pk)
            .values_list("pk", "stage_number")
        )

    previous_ids = [pk for pk, _stage_number in previous_active_stages]
    completed_ids = [
        pk for pk, stage_number in previous_active_stages
        if stage_number < milestone.stage_number
    ]
    active_stages = ConstructionMilestone.objects.filter(pk__in=previous_ids)
    active_stages.filter(pk__in=completed_ids).update(
        status="completed",
        progress_percent=100,
    )
    active_stages.exclude(pk__in=completed_ids).update(status="upcoming")


class ConstructionMilestoneAdminForm(forms.ModelForm):
    progress_percent = forms.IntegerField(
        label="Avancement (%)",
        min_value=0,
        max_value=100,
        help_text="Saisissez un pourcentage entre 0 et 100.",
    )

    class Meta:
        model = ConstructionMilestone
        fields = ("title", "status", "progress_percent", "photo")


class ConstructionMilestoneChangeListFormSet(forms.BaseModelFormSet):
    def save(self, commit=True):
        newly_active_form = next(
            (
                form for form in self.forms
                if "status" in form.changed_data
                and form.cleaned_data.get("status") == "in_progress"
            ),
            None,
        )
        previous_active_stages = []
        if commit and newly_active_form:
            previous_active_stages = list(
                self.model.objects.filter(status="in_progress")
                .exclude(pk=newly_active_form.instance.pk)
                .values_list("pk", "stage_number")
            )

        saved_instances = super().save(commit=commit)
        if commit and newly_active_form:
            set_current_stage(newly_active_form.instance, previous_active_stages)
        return saved_instances


@admin.register(ConstructionMilestone)
class ConstructionMilestoneAdmin(admin.ModelAdmin):
    form = ConstructionMilestoneAdminForm
    list_display = ("stage_number", "title", "status", "progress_percent", "photo_preview")
    list_editable = ("title", "status", "progress_percent")
    list_filter = ("status",)
    ordering = ("stage_number",)
    fields = ("stage_number", "title", "status", "progress_percent", "photo")
    readonly_fields = ("stage_number",)

    def get_changelist_form(self, request, **kwargs):
        kwargs.setdefault("form", self.form)
        return super().get_changelist_form(request, **kwargs)

    def get_changelist_formset(self, request, **kwargs):
        kwargs.setdefault("formset", ConstructionMilestoneChangeListFormSet)
        return super().get_changelist_formset(request, **kwargs)

    def save_model(self, request, obj, form, change):
        if obj.status == "in_progress":
            set_current_stage(obj)
        super().save_model(request, obj, form, change)

    @admin.display(description="Photo")
    def photo_preview(self, obj):
        if not obj.photo:
            return "Aucune photo"
        return format_html(
            '<img src="{}" alt="Photo de l’étape {}" style="max-width:120px;max-height:72px;object-fit:cover;border-radius:4px;">',
            obj.photo.url,
            obj.stage_number,
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ConstructionShowcase)
class ConstructionShowcaseAdmin(admin.ModelAdmin):
    fields = ("title", "caption", "photo", "photo_preview")
    readonly_fields = ("photo_preview",)

    @admin.display(description="Aperçu de la photo")
    def photo_preview(self, obj):
        if not obj.photo:
            return "La photo par défaut du site sera affichée."
        return format_html(
            '<img src="{}" alt="Photo principale du chantier" style="max-width:480px;max-height:280px;object-fit:cover;border-radius:8px;">',
            obj.photo.url,
        )

    def has_add_permission(self, request):
        return not ConstructionShowcase.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
