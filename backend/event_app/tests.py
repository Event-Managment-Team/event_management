from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from event_app.models import CustomUser


class FrontendBackendIntegrationTest(TestCase):
    """Tests verifying the API endpoints used by the frontend integration."""

    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            phone='1234567890',
            password='TestPass123!',
            is_active=True,
        )

    def _login(self):
        resp = self.client.post('/api/login/', {
            'username': 'testuser',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        tokens = resp.json()['tokens']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        return tokens

    def test_login_returns_tokens(self):
        resp = self.client.post('/api/login/', {
            'username': 'testuser',
            'password': 'TestPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn('tokens', data)
        self.assertIn('access', data['tokens'])
        self.assertIn('refresh', data['tokens'])

    def test_login_invalid_credentials(self):
        resp = self.client.post('/api/login/', {
            'username': 'testuser',
            'password': 'wrong',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_and_verify_otp(self):
        resp = self.client.post('/api/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'phone': '0001112222',
            'password': 'StrongPass123!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()
        self.assertIn('email', data)
        self.assertIn('otp', data)

        user = CustomUser.objects.get(username='newuser')
        self.assertFalse(user.is_active)

        resp = self.client.post('/api/verify-otp/', {
            'email': 'new@example.com',
            'otp': user.otp,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', resp.json())

        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_list_events_requires_auth(self):
        resp = self.client.get('/api/events/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_events_authenticated(self):
        self._login()
        resp = self.client.get('/api/events/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.json(), list)

    def test_create_event(self):
        self._login()
        resp = self.client.post('/api/events/', {
            'title': 'Integration Test Event',
            'desc': 'Testing frontend-backend integration',
            'type': 'online',
            'visibility': 'public',
            'start_date': '2026-04-01T10:00:00Z',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()
        self.assertEqual(data['title'], 'Integration Test Event')
        self.assertEqual(data['visibility'], 'public')
        self.assertEqual(data['type'], 'online')

    def test_create_event_with_location(self):
        self._login()
        resp = self.client.post('/api/events/', {
            'title': 'Offline Event',
            'desc': 'An in-person event',
            'type': 'offline',
            'visibility': 'public',
            'start_date': '2026-05-01T14:00:00Z',
            'building': 'Main Hall',
            'room': '301',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()
        self.assertEqual(data['building'], 'Main Hall')
        self.assertEqual(data['room'], '301')

    def test_logout(self):
        tokens = self._login()
        resp = self.client.post('/api/logout/', {
            'refresh': tokens['refresh'],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
