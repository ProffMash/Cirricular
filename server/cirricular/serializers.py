from rest_framework import serializers
from .models import Event, Registration
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['id', 'email', 'username', 'name', 'role', 'avatar', 'bio', 'phone', 'joinedDate']
		read_only_fields = ['joinedDate']
  
class EventSerializer(serializers.ModelSerializer):
	class Meta:
		model = Event
		fields = [
			'id', 'title', 'description', 'category', 'date', 'time', 'location',
			'capacity', 'registered_count', 'image_url', 'created_by', 'created_at', 'is_active'
		]
		read_only_fields = ['created_by', 'created_at', 'registered_count']

class RegistrationSerializer(serializers.ModelSerializer):
	class Meta:
		model = Registration
		fields = [
			'id', 'user', 'event', 'registered_at', 'status'
		]


class RegisterSerializer(serializers.ModelSerializer):
	password = serializers.CharField(write_only=True, required=True)
	username = serializers.CharField(required=False, allow_blank=True, allow_null=True)

	class Meta:
		model = User
		# allow optional username and vehicle info during registration
		# Note: do NOT expose `role` here so clients cannot set it during signup.
		fields = ['email', 'username', 'name', 'password', 'phone', 'avatar']

	def create(self, validated_data):
		# Ensure a username is provided to the user manager; derive from email if absent
		raw_email = validated_data['email']
		base_username = validated_data.get('username') or raw_email.split('@')[0]
		username = base_username
		# Ensure uniqueness by appending a numeric suffix if needed
		counter = 0
		while User.objects.filter(username=username).exists():
			counter += 1
			username = f"{base_username}{counter}"

		# Force role to 'user' regardless of client-supplied data to prevent privilege escalation.
		user = User.objects.create_user(
			email=raw_email,
			username=username,
			password=validated_data['password'],
			name=validated_data.get('name', ''),
			role='user',
			phone=validated_data.get('phone', ''),
			avatar=validated_data.get('avatar', None),
		)
		return user

	def validate_password(self, value):
		# ensure password is provided and has a reasonable minimum length
		if not value:
			raise serializers.ValidationError('Password is required')
		if len(value) < 6:
			raise serializers.ValidationError('Password must be at least 6 characters long')
		return value

class LoginSerializer(serializers.Serializer):
	email = serializers.EmailField()
	password = serializers.CharField(write_only=True)
