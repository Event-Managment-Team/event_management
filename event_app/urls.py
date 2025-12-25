from django.urls import path
from .views import (
    RegisterAPI, VerifyOTPAPI, LoginAPI,
    ForgotPasswordAPI, ResetPasswordAPI
)

urlpatterns = [
    path('api/register/', RegisterAPI.as_view(), name='api_register'),
    path('api/verify-otp/', VerifyOTPAPI.as_view(), name='api_verify_otp'),
    path('api/login/', LoginAPI.as_view(), name='api_login'),
    path('api/forgot-password/', ForgotPasswordAPI.as_view(), name='api_forgot_password'),
    path('api/reset-password/', ResetPasswordAPI.as_view(), name='api_reset_password'),
]
