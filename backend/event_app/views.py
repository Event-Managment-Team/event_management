from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate
from django.db.models import Q, Count
import random

from .models import (
    CustomUser, Role, Event, EventImage, EventAgenda, AllowedParticipant
)
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, LoginSerializer, LogoutSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    RoleSerializer, EventSerializer, EventImageSerializer, EventAgendaSerializer,
    AllowedParticipantSerializer # BU SERIALIZER-İ SERIALIZERS.PY-A ƏLAVƏ ETMƏYİ UNUTMA
)

def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}

class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)

# --- AUTHENTICATION ---

class RegisterAPI(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.otp = str(random.randint(100000, 999999))
            user.otp_created_at = timezone.now()
            user.save()
            try:
                send_mail("OTP Verification", f"Kod: {user.otp}", None, [user.email])
            except: pass
            return Response({"message": "OTP sent", "email": user.email}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPAPI(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyOTPSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                    user.is_active = True
                    user.otp = None
                    user.save()
                    return Response({"tokens": get_tokens(user)}, status=status.HTTP_200_OK)
            except: pass
        return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(username=serializer.validated_data["username"], password=serializer.validated_data["password"])
            if user:
                if not user.is_active: return Response({"error": "Verify OTP"}, status=status.HTTP_403_FORBIDDEN)
                return Response({"tokens": get_tokens(user)}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutAPI(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                RefreshToken(serializer.validated_data["refresh"]).blacklist()
                return Response({"success": "Logged out"})
            except: pass
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordAPI(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                user.otp = str(random.randint(100000, 999999))
                user.otp_created_at = timezone.now()
                user.save()
                send_mail("Reset OTP", f"Code: {user.otp}", None, [user.email])
                return Response({"message": "OTP sent"})
            except: return Response({"error": "User not found"}, status=404)
        return Response(serializer.errors, status=400)

class ResetPasswordAPI(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
                if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                    user.set_password(serializer.validated_data["new_password"])
                    user.otp = None
                    user.save()
                    return Response({"message": "Password reset success"})
            except: pass
        return Response({"error": "Invalid request"}, status=400)

# --- VIEWSETS ---

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsActiveUser(), permissions.IsAdminUser()]
        return [IsAuthenticated(), IsActiveUser()]

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

    @action(detail=True, methods=['get'])
    def group_statistics(self, request, pk=None):
        event = self.get_object()
        stats = event.allowed_participants.values('group_name').annotate(count=Count('id'))
        return Response(stats)

class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

# YENİ: İŞTİRAKÇI QEYDİYYATI (JOIN EVENT)
class AllowedParticipantViewSet(viewsets.ModelViewSet):
    queryset = AllowedParticipant.objects.all()
    serializer_class = AllowedParticipantSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

    def perform_create(self, serializer):
        # Əgər tələbə özü qoşulursa, sistem avtomatik onun emailini götürür
        if not self.request.user.is_staff:
            serializer.save(email=self.request.user.email)
        else:
            # Staff-dırsa, başqasını da əlavə edə bilər (email daxil etməklə)
            serializer.save()
