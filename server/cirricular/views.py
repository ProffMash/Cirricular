from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.conf import settings
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

    def list(self, request, *args, **kwargs):
        if not request.query_params:
            cached = cache.get('registrations_list')
            if cached is not None:
                return Response(cached)

            resp = super().list(request, *args, **kwargs)
            try:
                cache.set('registrations_list', resp.data, timeout=10)
            except Exception:
                pass
            return resp

        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk:
            key = f'registration_{pk}'
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
        data = request.data.copy() if isinstance(request.data, dict) else request.data
        if 'user' not in data and request.user and request.user.is_authenticated:
            data['user'] = request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
