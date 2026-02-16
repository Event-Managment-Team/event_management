from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import random
from .models import (
    CustomUser, Role, Event, EventImage,
)
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    RoleSerializer, EventSerializer, EventImageSerializer,
)


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class IsActiveUser(BasePermission):
    """
    Denies access to inactive users with 403 Forbidden.
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and not request.user.is_active:
            return False
        return True


class RegisterAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.otp = str(random.randint(100000, 999999))
            user.otp_created_at = timezone.now()
            user.save()
            try:
                send_mail(
                    subject="OTP Verification",
                    message=f"Your OTP code is {user.otp}. It expires in 5 minutes.",
                    from_email=None,
                    recipient_list=[user.email],
                )
            except Exception:
                pass
            print(f"[DEBUG] OTP for {user.email}: {user.otp}")
            return Response(
                {"message": "User registered. OTP sent to email.", "email": user.email, "otp": user.otp},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                user.is_active = True
                user.otp = None
                user.otp_created_at = None
                user.save()
                return Response({
                    "message": "Account verified successfully.",
                    "tokens": get_tokens(user)
                }, status=status.HTTP_200_OK)
            return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]

            # First check if user exists and is inactive
            try:
                user_obj = CustomUser.objects.get(username=username)
                if not user_obj.is_active:
                    return Response(
                        {"error": "Account not verified. Please verify OTP first."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Invalid credentials."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user = authenticate(username=username, password=password)
            if not user:
                return Response(
                    {"error": "Invalid credentials."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response({
                "message": "Login successful.",
                "tokens": get_tokens(user)
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ForgotPasswordAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "Email not found."}, status=status.HTTP_404_NOT_FOUND)
            user.otp = str(random.randint(100000, 999999))
            user.otp_created_at = timezone.now()
            user.save()
            try:
                send_mail(
                    subject="Password Reset OTP",
                    message=f"Your password reset OTP is {user.otp}. It expires in 5 minutes.",
                    from_email=None,
                    recipient_list=[user.email],
                )
            except Exception:
                pass
            print(f"[DEBUG] Reset OTP for {user.email}: {user.otp}")
            return Response({"message": "OTP sent to email.", "otp": user.otp}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            if user.otp != serializer.validated_data["otp"] or not user.otp_is_valid():
                return Response(
                    {"error": "Invalid or expired OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data["new_password"])
            user.otp = None
            user.otp_created_at = None
            user.save()
            return Response({
                "message": "Password reset successful.",
                "tokens": get_tokens(user)
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_queryset(self):
        queryset = Event.objects.all()
        user = self.request.user
        if user.is_authenticated and user.roles.exists():
            user_role_ids = user.roles.values_list('id', flat=True)
            queryset = queryset.filter(
                allowed_roles__id__in=user_role_ids
            ).distinct() | queryset.filter(allowed_roles__isnull=True).distinct()
        return queryset.distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
