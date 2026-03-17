from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterAPI, VerifyOTPAPI, LoginAPI, LogoutAPI,
    ForgotPasswordAPI, ResetPasswordAPI,
    RoleViewSet, EventViewSet, EventImageViewSet,
    AllowedParticipantViewSet  
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'events', EventViewSet, basename='events')
router.register(r'event-images', EventImageViewSet, basename='event-images')
router.register(r'allowed-participants', AllowedParticipantViewSet, basename='allowed-participants') 

urlpatterns = [
    path('api/register/', RegisterAPI.as_view(), name='api_register'),
    path('api/verify-otp/', VerifyOTPAPI.as_view(), name='api_verify_otp'),
    path('api/login/', LoginAPI.as_view(), name='api_login'),
    path('api/logout/', LogoutAPI.as_view(), name='api_logout'),
    path('api/forgot-password/', ForgotPasswordAPI.as_view(), name='api_forgot_password'),
    path('api/reset-password/', ResetPasswordAPI.as_view(), name='api_reset_password'),
    path('api/', include(router.urls)),
]
