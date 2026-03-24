from rest_framework import serializers
from .models import Event, Registration
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
	isActive = serializers.BooleanField(source='is_active', required=False)
	latestRegistrationDate = serializers.SerializerMethodField()

	def get_latestRegistrationDate(self, obj):
		latest = obj.registration_set.filter(is_deleted=False).order_by('-registered_at').first()
		return latest.registered_at if latest else None

	class Meta:
		model = User
		fields = ['id', 'email', 'username', 'name', 'regNo', 'school', 'role', 'avatar', 'bio', 'phone', 'joinedDate', 'isActive', 'latestRegistrationDate']
		read_only_fields = ['joinedDate']

	def validate_regNo(self, value):
		reg_no = value.strip()
		if not reg_no:
			raise serializers.ValidationError('Registration number is required')
		return reg_no

	def validate_school(self, value):
		if value not in dict(User.SCHOOL_CHOICES):
			raise serializers.ValidationError('Select a valid school')
		return value
  
class EventSerializer(serializers.ModelSerializer):
	registered_count = serializers.SerializerMethodField()

	def get_registered_count(self, obj):
		return obj.registration_set.filter(
			status=Registration.RegistrationStatus.CONFIRMED,
			is_deleted=False,
		).count()

	class Meta:
		model = Event
		fields = [
			'id', 'title', 'description', 'category', 'date', 'time', 'location',
			'capacity', 'registered_count', 'created_by', 'created_at', 'is_active'
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
	regNo = serializers.CharField(required=True, allow_blank=False)
	school = serializers.ChoiceField(choices=User.SCHOOL_CHOICES, required=True)

	class Meta:
		model = User
		# allow optional username and vehicle info during registration
		# Note: do NOT expose `role` here so clients cannot set it during signup.
		fields = ['email', 'username', 'name', 'password', 'phone', 'avatar', 'regNo', 'school']

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
			regNo=validated_data['regNo'].strip(),
			school=validated_data['school'],
			role='user',
			phone=validated_data.get('phone', ''),
			avatar=validated_data.get('avatar', None),
		)
		return user

	def validate_regNo(self, value):
		reg_no = value.strip()
		if not reg_no:
			raise serializers.ValidationError('Registration number is required')
		return reg_no

	def validate_school(self, value):
		if value not in dict(User.SCHOOL_CHOICES):
			raise serializers.ValidationError('Select a valid school')
		return value

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
