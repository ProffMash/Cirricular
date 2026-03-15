from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class RegistrationFlowTests(APITestCase):
	def test_register_stores_reg_no(self):
		response = self.client.post(
			reverse('register'),
			{
				'name': 'Student User',
				'email': 'student@example.com',
				'password': 'secret123',
				'regNo': 'REG-2026-001',
				'school': 'Engineering',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(
			User.objects.filter(email='student@example.com', regNo='REG-2026-001', school='Engineering').exists()
		)

	def test_login_returns_reg_no(self):
		user = User.objects.create_user(
			email='student2@example.com',
			username='student2',
			password='secret123',
			name='Student Two',
			regNo='REG-2026-002',
			school='SPAS',
		)

		response = self.client.post(
			reverse('login'),
			{
				'email': user.email,
				'password': 'secret123',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['regNo'], 'REG-2026-002')
		self.assertEqual(response.data['school'], 'SPAS')
