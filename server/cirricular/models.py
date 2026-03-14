from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, role='user', **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, role='admin', **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user') 
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, max_length=255)
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    joinedDate = models.DateTimeField(auto_now_add=True)
    
    # Override the default related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='cirricular_users',
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='cirricular_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    def __str__(self):
        return self.email
    

class Event(models.Model):
    class EventCategory(models.TextChoices):
        SPORTS = 'sports', 'Sports'
        ARTS = 'arts', 'Arts'
        ACADEMICS = 'academics', 'Academics'
        CULTURAL = 'cultural', 'Cultural'
        TECH= 'tech', 'Tech'
        SOCIAL = 'social', 'Social'

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=EventCategory.choices)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField()
    registered_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title
    
    
class Registration(models.Model):
    class RegistrationStatus(models.TextChoices):
        CONFIRMED = 'confirmed', 'Confirmed'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey('Event', on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=RegistrationStatus.choices, default=RegistrationStatus.CONFIRMED)

    def __str__(self):
        return f"{self.user} - {self.event} ({self.status})"

