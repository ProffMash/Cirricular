from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
import hashlib
import time
from .models import Event, Registration
from .serializers import (
    UserSerializer,
    EventSerializer,
    RegistrationSerializer,
    RegisterSerializer,
    LoginSerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def list(self, request, *args, **kwargs):
        if not request.query_params:
            cached = cache.get('users_list')
            if cached is not None:
                return Response(cached)

            resp = super().list(request, *args, **kwargs)
            try:
                cache.set('users_list', resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk:
            key = f'user_{pk}'
            cached = cache.get(key)
            if cached is not None:
                return Response(cached)

            resp = super().retrieve(request, *args, **kwargs)
            try:
                cache.set(key, resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().retrieve(request, *args, **kwargs)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request, *args, **kwargs):
        if not request.query_params:
            cached = cache.get('events_list')
            if cached is not None:
                return Response(cached)

            resp = super().list(request, *args, **kwargs)
            try:
                cache.set('events_list', resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk:
            key = f'event_{pk}'
            cached = cache.get(key)
            if cached is not None:
                return Response(cached)

            resp = super().retrieve(request, *args, **kwargs)
            try:
                cache.set(key, resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    def _is_admin(self, user):
        return bool(user and user.is_authenticated and getattr(user, 'role', None) == 'admin')

    def _invalidate_event_cache(self, event_id=None):
        try:
            cache.delete('events_list')
            if event_id:
                cache.delete(f'event_{event_id}')
        except Exception:
            pass

    def _invalidate_registration_cache(self, registration_id=None, user_id=None):
        try:
            cache.delete('registrations_list_admin')
            if user_id:
                cache.delete(f'registrations_list_user_{user_id}')
            if registration_id:
                cache.delete(f'registration_{registration_id}_admin')
                if user_id:
                    cache.delete(f'registration_{registration_id}_user_{user_id}')
        except Exception:
            pass

    def get_queryset(self):
        queryset = Registration.objects.filter(is_deleted=False)
        if self._is_admin(self.request.user):
            return queryset
        return queryset.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        if not request.query_params:
            cache_key = (
                'registrations_list_admin'
                if self._is_admin(request.user)
                else f'registrations_list_user_{request.user.id}'
            )
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

            resp = super().list(request, *args, **kwargs)
            try:
                cache.set(cache_key, resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk:
            key = (
                f'registration_{pk}_admin'
                if self._is_admin(request.user)
                else f'registration_{pk}_user_{request.user.id}'
            )
            cached = cache.get(key)
            if cached is not None:
                return Response(cached)

            resp = super().retrieve(request, *args, **kwargs)
            try:
                cache.set(key, resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if not self._is_admin(request.user):
            data['user'] = request.user.id
        elif 'user' not in data and request.user and request.user.is_authenticated:
            data['user'] = request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        self._invalidate_registration_cache(user_id=serializer.instance.user_id)
        self._invalidate_event_cache(serializer.instance.event_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if not self._is_admin(request.user) and instance.user_id != request.user.id:
            raise PermissionDenied('You can only update your own registration.')
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        self._invalidate_registration_cache(
            registration_id=serializer.instance.id,
            user_id=serializer.instance.user_id,
        )
        self._invalidate_event_cache(serializer.instance.event_id)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        if not self._is_admin(request.user):
            raise PermissionDenied('Only admins can delete registrations.')
        instance = self.get_object()
        event_id = instance.event_id
        registration_id = instance.id
        user_id = instance.user_id
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])
        self._invalidate_registration_cache(registration_id=registration_id, user_id=user_id)
        self._invalidate_event_cache(event_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='deregister')
    def deregister(self, request, pk=None):
        if not self._is_admin(request.user):
            raise PermissionDenied('Only admins can deregister users from events.')

        registration = Registration.objects.filter(pk=pk).first()
        if not registration:
            return Response({'detail': 'Registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        if registration.status == Registration.RegistrationStatus.CANCELLED:
            return Response(
                {'detail': 'Registration is already cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registration.status = Registration.RegistrationStatus.CANCELLED
        registration.save(update_fields=['status'])
        self._invalidate_registration_cache(
            registration_id=registration.id,
            user_id=registration.user_id,
        )
        self._invalidate_event_cache(registration.event_id)

        serializer = self.get_serializer(registration)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'message': 'User registered successfully', 'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, username=email, password=password)
            if user is not None:
                token, _ = Token.objects.get_or_create(user=user)
                serializer = UserSerializer(user, context={'request': request})
                data = serializer.data
                data.update({'message': 'Login successful', 'token': token.key})
                return Response(data, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvatarUploadSignatureView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cloud_name = settings.CLOUDINARY_CLOUD_NAME
        api_key = settings.CLOUDINARY_API_KEY
        api_secret = settings.CLOUDINARY_API_SECRET

        if not cloud_name or not api_key or not api_secret:
            return Response(
                {'error': 'Cloudinary settings are not configured on the server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        timestamp = int(time.time())
        folder = 'cirricular/avatars'
        sign_payload = f'folder={folder}&timestamp={timestamp}{api_secret}'
        signature = hashlib.sha1(sign_payload.encode('utf-8')).hexdigest()

        return Response(
            {
                'cloudName': cloud_name,
                'apiKey': api_key,
                'timestamp': timestamp,
                'folder': folder,
                'signature': signature,
            },
            status=status.HTTP_200_OK,
        )
