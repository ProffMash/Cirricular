from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    EventViewSet,
    RegistrationViewSet,
    RegisterView,
    LoginView,
    AvatarUploadSignatureView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'events', EventViewSet)
router.register(r'registrations', RegistrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('uploads/avatar-signature/', AvatarUploadSignatureView.as_view(), name='avatar-upload-signature'),
]
