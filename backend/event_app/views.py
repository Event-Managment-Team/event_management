from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import authenticate, logout as django_logout
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import random, uuid
from .models import (
    CustomUser, Role, Event, EventImage,
    EventAllowedEmail, EventRegistration,
    EventAgenda, EventAccessToken
)
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    RoleSerializer, EventSerializer, EventImageSerializer,
    EventAllowedEmailSerializer, EventRegistrationSerializer,
    EventAgendaSerializer, EventAccessTokenSerializer
)


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class RegisterAPI(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(is_active=False)
            user.otp = str(random.randint(100000, 999999))
            user.otp_created_at = timezone.now()
            user.save()
            send_mail(
                subject="OTP Verification",
                message=f"Your OTP code is {user.otp}",
                from_email="no-reply@test.com",
                recipient_list=[user.email],
            )
            return Response({"message": "OTP sent to email"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPAPI(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
            if user.otp == serializer.validated_data["otp"] and user.otp_is_valid():
                user.is_active = True
                user.otp = None
                user.otp_created_at = None
                user.save()
                return Response({"message": "Account verified", "tokens": get_tokens(user)})
            return Response({"error": "Invalid or expired OTP"}, status=400)
        return Response(serializer.errors, status=400)

class LoginAPI(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data["username"],
                password=serializer.validated_data["password"]
            )
            if not user:
                return Response({"error": "Invalid credentials"}, status=401)
            if not user.is_active:
                return Response({"error": "Account not verified"}, status=403)
            return Response({"message": "Login successful", "tokens": get_tokens(user)})
        return Response(serializer.errors, status=400)

class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        django_logout(request)
        return Response({"message": "Logged out successfully"})

class ForgotPasswordAPI(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "Email not found"}, status=404)
            user.otp = str(random.randint(100000, 999999))
            user.otp_created_at = timezone.now()
            user.save()
            send_mail(
                subject="Password Reset OTP",
                message=f"Your OTP is {user.otp}",
                from_email="no-reply@test.com",
                recipient_list=[user.email],
            )
            return Response({"message": "OTP sent to email"})
        return Response(serializer.errors, status=400)

class ResetPasswordAPI(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CustomUser.objects.get(email=serializer.validated_data["email"])
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
            if user.otp != serializer.validated_data["otp"] or not user.otp_is_valid():
                return Response({"error": "Invalid or expired OTP"}, status=400)
            user.set_password(serializer.validated_data["new_password"])
            user.otp = None
            user.otp_created_at = None
            user.save()
            return Response({"message": "Password reset successful", "tokens": get_tokens(user)})
        return Response(serializer.errors, status=400)


class CanViewEvent(BasePermission):
    """
    Checks if a user can view the event:
    - Public events → anyone
    - Private events → must have role or be in allowed_emails
    """
    def has_object_permission(self, request, view, obj):
        if obj.visibility == 'public':
            return True
        if request.user.is_authenticated:
            user_roles = request.user.roles.all()
            if obj.allowed_roles.filter(id__in=user_roles).exists():
                return True
        
        email = request.user.email if request.user.is_authenticated else request.query_params.get('email')
        token = request.query_params.get('token')
        if token:
            try:
                t = EventAccessToken.objects.get(token=token, event=obj)
                return t.is_valid() and t.email == email
            except EventAccessToken.DoesNotExist:
                return False
        if email:
            return obj.allowed_emails.filter(email=email).exists()
        return False


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, CanViewEvent]

    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        email = request.data.get('email')
        user = request.user if request.user.is_authenticated else None
        if not email and not user:
            return Response({"error": "Email required for registration"}, status=400)
        if not email:
            email = user.email
        reg, created = EventRegistration.objects.get_or_create(event=event, email=email, defaults={'user': user})
        if not created:
            return Response({"message": "Already registered"}, status=200)
        return Response({"message": "Registered successfully"}, status=201)


class EventImageViewSet(viewsets.ModelViewSet):
    queryset = EventImage.objects.all()
    serializer_class = EventImageSerializer
    permission_classes = [IsAuthenticated]
