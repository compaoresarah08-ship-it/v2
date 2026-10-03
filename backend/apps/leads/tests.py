from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings

from .models import Lead


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    DEFAULT_FROM_EMAIL='noema-test@example.com',
    NOEMA_CONTACT_EMAIL='sales-test@example.com',
)
class LeadDeliveryTests(TestCase):
    def setUp(self):
        cache.clear()
        self.contact = {
            'first_name': 'TEST NOEMA', 'last_name': 'DEPLOIEMENT',
            'email': 'deployment-test@example.com',
            'phone_whatsapp': '+225000000001',
            'residence_country': "Côte d'Ivoire",
            'consent_data_processing': True, 'website': '',
        }

    def test_financing_is_saved_with_empty_honeypot_and_reply_to(self):
        response = self.client.post('/api/leads/', self.contact, content_type='application/json')
        self.assertEqual(response.status_code, 201, response.content)
        self.assertTrue(Lead.objects.filter(pk=response.json()['data']['id']).exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].reply_to, [self.contact['email']])
        self.assertEqual(mail.outbox[0].to, ['sales-test@example.com'])

    def test_spam_honeypot_does_not_create_a_lead(self):
        response = self.client.post('/api/leads/', {**self.contact, 'website': 'spam'}, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Lead.objects.filter(email=self.contact['email']).exists())

    def appointment(self):
        return {
            **self.contact, 'appointment_date': '2030-01-15',
            'appointment_time': '10:00', 'appointment_mode': 'visio',
            'timezone': 'Africa/Abidjan',
        }

    def test_appointment_is_persistent_and_mail_has_reply_to(self):
        response = self.client.post('/api/leads/appointment-notification/', self.appointment(), content_type='application/json')
        self.assertEqual(response.status_code, 201, response.content)
        lead = Lead.objects.get(pk=response.json()['data']['lead_id'])
        self.assertEqual(lead.pipeline_stage, 'meeting_scheduled')
        self.assertIn('2030-01-15', lead.notes)
        self.assertEqual(mail.outbox[0].reply_to, [self.contact['email']])

    @patch('apps.leads.serializers.EmailMessage.send', side_effect=OSError('SMTP unavailable'))
    def test_appointment_is_saved_but_failure_is_not_reported_as_mail_success(self, _send):
        response = self.client.post('/api/leads/appointment-notification/', self.appointment(), content_type='application/json')
        self.assertEqual(response.status_code, 502)
        self.assertEqual(Lead.objects.filter(email=self.contact['email']).count(), 1)

    @patch('apps.leads.serializers.EmailMessage.send', side_effect=OSError('SMTP unavailable'))
    def test_financing_lead_survives_mail_outage(self, _send):
        response = self.client.post('/api/leads/', self.contact, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Lead.objects.filter(pk=response.json()['data']['id']).exists())
