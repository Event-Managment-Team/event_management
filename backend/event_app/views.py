from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError
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
            username_input = serializer.validated_data["username"].strip()
            password_input = serializer.validated_data["password"]

            # Allow users to sign in with either username or email.
            user = CustomUser.objects.filter(
                Q(username__iexact=username_input) | Q(email__iexact=username_input)
            ).first()

            if not user or not user.check_password(password_input):
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

            if not user.is_active:
                return Response({"error": "Verify OTP"}, status=status.HTTP_403_FORBIDDEN)
            user_info = {
                "username": user.username,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
            return Response({"tokens": get_tokens(user), "user": user_info}, status=status.HTTP_200_OK)
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
        # İstifadəçi yalnız öz rol(lar)ına icazə verilən eventləri görməlidir.
        # Public eventlər: ya rol məhdudiyyəti yoxdur, ya da istifadəçinin rolu uyğundur.
        # Private eventlər: eyni qayda ilə yalnız uyğun rol olduqda görünür.
        user_role_ids = user.roles.values_list('id', flat=True)

        return Event.objects.filter(
            Q(allowed_roles__isnull=True) | Q(allowed_roles__id__in=user_role_ids)
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
        # Tədbiri serializer məlumatından götür
        event = serializer.validated_data.get('event')
        if not event:
            raise ValidationError({"event": "Event is required."})

        # Email təyin et: tələbə üçün sistem özü götürür, staff üçün request-dən
        if self.request.user.is_staff:
            email = self.request.data.get('email')
            if not email:
                raise ValidationError({"email": "Email daxil etmək tələb olunur."})
        else:
            email = self.request.user.email

            # Rol məhdudiyyəti: əgər tədbir üçün allowed_roles təyin olunubsa,
            # istifadəçinin rolu onlardan biri olmalıdır.
            event_roles = event.allowed_roles.all()
            if event_roles.exists():
                if not self.request.user.roles.filter(id__in=event_roles.values_list('id', flat=True)).exists():
                    raise ValidationError({"detail": "Bu tədbir üçün uyğun rolunuz yoxdur."})

        # Maksimum iştirakçı limiti
        if event.max_participants is not None and event.allowed_participants.count() >= event.max_participants:
            raise ValidationError({"detail": "Bu tədbir üçün maksimum iştirakçı sayı dolub."})

        # Eyni tədbirə təkrar qoşulmağın qarşısını al
        if AllowedParticipant.objects.filter(event=event, email=email).exists():
            raise ValidationError({"detail": "Artıq bu tədbirə qoşulmusan."})

        serializer.save(email=email)
