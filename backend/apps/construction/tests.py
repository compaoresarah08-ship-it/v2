from io import BytesIO
from tempfile import TemporaryDirectory

from PIL import Image
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, RequestFactory, TestCase
from django.test.utils import override_settings
from django.utils.html import escape

from .admin import (
    ConstructionMilestoneAdmin,
    ConstructionMilestoneAdminForm,
    ConstructionShowcaseAdmin,
)
from .models import ConstructionMilestone, ConstructionShowcase


class ConstructionMilestoneAdminTests(TestCase):
    def setUp(self):
        self.model_admin = ConstructionMilestoneAdmin(ConstructionMilestone, admin.site)
        self.request = RequestFactory().get("/admin/apps/construction/constructionmilestone/")

    def test_admin_form_only_exposes_the_fields_needed_to_update_a_stage(self):
        form = self.model_admin.get_form(self.request)

        self.assertEqual(
            set(form.base_fields),
            {"title", "status", "progress_percent", "photo"},
        )
        self.assertEqual(
            self.model_admin.get_fields(self.request),
            ("stage_number", "title", "status", "progress_percent", "photo"),
        )

    def test_progress_must_be_between_zero_and_one_hundred(self):
        form = ConstructionMilestoneAdminForm(data={
            "title": "Étape test",
            "status": "in_progress",
            "progress_percent": "101",
        })

        self.assertFalse(form.is_valid())
        self.assertIn("progress_percent", form.errors)

    def test_quick_edit_uses_the_same_progress_limit(self):
        form = self.model_admin.get_changelist_formset(self.request).form(
            data={
                "title": "Étape test",
                "status": "in_progress",
                "progress_percent": "101",
            },
        )

        self.assertFalse(form.is_valid())
        self.assertIn("progress_percent", form.errors)
        self.assertEqual(form.fields["progress_percent"].max_value, 100)

    def test_quick_edit_keeps_only_one_stage_in_progress(self):
        stages = list(ConstructionMilestone.objects.order_by("stage_number"))
        formset_data = {
            "form-TOTAL_FORMS": str(len(stages)),
            "form-INITIAL_FORMS": str(len(stages)),
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
        }
        for index, stage in enumerate(stages):
            formset_data.update({
                f"form-{index}-id": str(stage.pk),
                f"form-{index}-title": stage.title,
                f"form-{index}-status": "in_progress" if stage.stage_number == 2 else "upcoming",
                f"form-{index}-progress_percent": str(stage.progress_percent),
            })

        formset = self.model_admin.get_changelist_formset(self.request)(
            data=formset_data,
            queryset=ConstructionMilestone.objects.order_by("stage_number"),
        )

        self.assertTrue(formset.is_valid(), formset.errors)
        formset.save()

        self.assertEqual(
            list(ConstructionMilestone.objects.filter(status="in_progress").values_list("stage_number", flat=True)),
            [2],
        )
        first_stage = ConstructionMilestone.objects.get(stage_number=1)
        self.assertEqual(first_stage.status, "completed")
        self.assertEqual(first_stage.progress_percent, 100)

    def test_admin_does_not_allow_adding_or_deleting_stages(self):
        self.assertFalse(self.model_admin.has_add_permission(self.request))
        self.assertFalse(self.model_admin.has_delete_permission(self.request))


class ConstructionMilestoneAdminPageTests(TestCase):
    def test_initial_stages_are_available_in_the_simplified_admin(self):
        self.assertEqual(ConstructionMilestone.objects.count(), 5)
        first_stage = ConstructionMilestone.objects.get(stage_number=1)
        self.assertEqual(first_stage.status, "in_progress")
        self.assertEqual(first_stage.progress_percent, 70)

        user = get_user_model().objects.create_superuser(
            username="construction-admin",
            email="construction-admin@example.com",
            password="test-password",
        )
        client = Client()
        client.force_login(user)

        response = client.get("/admin/construction/constructionmilestone/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, escape(first_stage.title))
        self.assertContains(response, 'name="form-0-progress_percent"')
        self.assertNotContains(response, "Description détaillée des travaux")
        self.assertNotContains(response, "Lien vidéo de suivi")


class ConstructionShowcaseAdminTests(TestCase):
    def setUp(self):
        self.model_admin = ConstructionShowcaseAdmin(ConstructionShowcase, admin.site)
        self.request = RequestFactory().get("/admin/construction/constructionshowcase/")
        self.showcase = ConstructionShowcase.objects.get(pk=1)
        self.user = get_user_model().objects.create_superuser(
            username="showcase-admin",
            email="showcase-admin@example.com",
            password="test-password",
        )

    def test_admin_separates_the_showcase_photo_and_labels_from_milestones(self):
        form = self.model_admin.get_form(self.request)

        self.assertEqual(set(form.base_fields), {"title", "caption", "photo"})
        self.assertEqual(
            self.model_admin.get_fields(self.request),
            ("title", "caption", "photo", "photo_preview"),
        )

    def test_admin_can_upload_and_replace_the_independent_showcase_photo(self):
        image = BytesIO()
        Image.new("RGB", (2, 2), color="green").save(image, format="PNG")
        upload = SimpleUploadedFile("chantier.png", image.getvalue(), content_type="image/png")
        temporary_media = TemporaryDirectory()
        self.addCleanup(temporary_media.cleanup)

        with override_settings(MEDIA_ROOT=temporary_media.name):
            client = Client()
            client.force_login(self.user)
            response = client.post(
                f"/admin/construction/constructionshowcase/{self.showcase.pk}/change/",
                {
                    "title": "Nouvelle vue du chantier",
                    "caption": "Travaux en cours sur le bâtiment",
                    "photo": upload,
                    "_save": "Enregistrer",
                },
            )

            self.assertEqual(response.status_code, 302)
            self.showcase.refresh_from_db()
            self.assertEqual(self.showcase.title, "Nouvelle vue du chantier")
            self.assertEqual(self.showcase.caption, "Travaux en cours sur le bâtiment")
            self.assertTrue(self.showcase.photo.name.endswith("chantier.png"))
            self.assertTrue(self.showcase.photo.storage.exists(self.showcase.photo.name))

    def test_showcase_endpoint_is_public_and_returns_separate_photo_metadata(self):
        response = Client().get("/api/construction/showcase/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["title"], self.showcase.title)
        self.assertEqual(response.json()["data"]["caption"], self.showcase.caption)
        self.assertIsNone(response.json()["data"]["photo"])
