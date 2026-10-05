from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Apartment


class ApartmentPublicApiTests(APITestCase):
    def test_public_listing_only_returns_available_apartments_for_staff_sessions(self):
        reserved_public_apartment = Apartment.objects.filter(is_public=True).first()
        self.assertIsNotNone(reserved_public_apartment)
        reserved_public_apartment.status = 'reserved'
        reserved_public_apartment.save()

        staff_user = get_user_model().objects.create_user(
            username='crm@example.com',
            password='NoemaSecurePassword!2026',
            is_staff=True,
        )
        self.client.force_authenticate(user=staff_user)

        response = self.client.get('/api/apartments/', {'public': 'true'})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Apartment.objects.filter(is_public=False).exists())
        self.assertTrue(all(
            apartment['is_public'] and apartment['status'] == 'available'
            for apartment in response.data
        ))

        crm_response = self.client.get('/api/apartments/')

        self.assertTrue(any(not apartment['is_public'] for apartment in crm_response.data))
        self.assertTrue(any(
            apartment['is_public'] and apartment['status'] == 'reserved'
            for apartment in crm_response.data
        ))

        self.client.force_authenticate(user=None)
        anonymous_response = self.client.get('/api/apartments/')
        self.assertTrue(all(apartment['status'] == 'available' for apartment in anonymous_response.data))