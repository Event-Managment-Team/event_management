from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db.models import Q
import random

from .models import (
    CustomUser, Role, Event, EventImage, EventAgenda, AllowedParticipant
)
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    RoleSerializer, EventSerializer, EventImageSerializer, EventAgendaSerializer
)

def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}

class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)

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
            except Exception: pass
            return Response({"message": "User registered. OTP sent.", "email": user.email, "otp": user.otp}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                    user.is_active = True
                    user.otp = None
                    user.save()
                    return Response({"message": "Verified", "tokens": get_tokens(user)}, status=status.HTTP_200_OK)
            except CustomUser.DoesNotExist: pass
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(username=serializer.validated_data["username"], password=serializer.validated_data["password"])
            if user:
                if not user.is_active:
                    return Response({"error": "Verify OTP first."}, status=status.HTTP_403_FORBIDDEN)
                return Response({"tokens": get_tokens(user)}, status=status.HTTP_200_OK)
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        refresh_token = request.data.get("refresh")
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                user.otp = str(random.randint(100000, 999999))
                user.otp_created_at = timezone.now()
                user.save()
                send_mail(subject="Reset OTP", message=f"Code: {user.otp}", from_email=None, recipient_list=[user.email])
                return Response({"message": "OTP sent."}, status=status.HTTP_200_OK)
            except CustomUser.DoesNotExist:
                return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordAPI(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                    user.set_password(serializer.validated_data["new_password"])
                    user.otp = None
                    user.save()
                    return Response({"message": "Success"}, status=status.HTTP_200_OK)
            except CustomUser.DoesNotExist: pass
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Event.objects.all()
        return Event.objects.filter(
            Q(visibility='public') | 
            Q(visibility='private', allowed_participants__email=user.email)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]