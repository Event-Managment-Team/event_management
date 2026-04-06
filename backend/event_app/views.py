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
from datetime import timedelta
import random
import logging

# Required for reminder tasks (Run: pip install django-apscheduler)
from django_apscheduler.jobstores import DjangoJobStore
from apscheduler.schedulers.background import BackgroundScheduler

from .models import (
    CustomUser, Role, Event, EventImage, EventAgenda, AllowedParticipant
)
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, LoginSerializer, LogoutSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    RoleSerializer, AdminUserRoleSerializer, EventSerializer, EventImageSerializer, EventAgendaSerializer,
    AllowedParticipantSerializer
)

logger = logging.getLogger(__name__)

# --- SCHEDULER SETUP ---
scheduler = BackgroundScheduler()
scheduler.add_jobstore(DjangoJobStore(), "default")
if not scheduler.running:
    scheduler.start()

def send_reminder_email(email, event_title, start_date):
    """Helper function to send reminder emails."""
    subject = f"Reminder: {event_title} starts soon!"
    message = (
        f"Dear participant,\n\n"
        f"This is a reminder that the event '{event_title}' will start soon.\n"
        f"Start Time: {start_date.strftime('%H:%M')}\n\n"
        f"Best regards!"
    )
    try:
        send_mail(subject, message, None, [email], fail_silently=False)
        print(f"SUCCESS: Email sent to {email} for event {event_title}")
    except Exception as e:
        logger.error(f"Error sending reminder email: {str(e)}")
        print(f"ERROR: Failed to send email: {str(e)}")

# --- HELPERS ---

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
                send_mail("OTP Verification", f"Code: {user.otp}", None, [user.email], fail_silently=False)
            except Exception:
                logger.exception("Failed to send OTP email during registration")
                user.delete()
                return Response(
                    {"error": "Could not send OTP email. Please check server configurations."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
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
                send_mail("Reset OTP", f"Code: {user.otp}", None, [user.email], fail_silently=False)
                return Response({"message": "OTP sent"})
            except CustomUser.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
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

class AdminUserRoleViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserRoleSerializer
    permission_classes = [IsAuthenticated, IsActiveUser, permissions.IsAdminUser]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = CustomUser.objects.prefetch_related('roles').order_by('username')
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return queryset

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsActiveUser(), permissions.IsAdminUser()]
        return [IsAuthenticated(), IsActiveUser()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser: 
            queryset = Event.objects.all()
        else:
            user_role_ids = user.roles.values_list('id', flat=True)
            queryset = Event.objects.filter(
                Q(allowed_roles__isnull=True) | Q(allowed_roles__id__in=user_role_ids)
            ).distinct()

        event_type = self.request.query_params.get('type')
        if event_type in {'online', 'offline', 'hybrid'}:
            queryset = queryset.filter(type=event_type)

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(desc__icontains=search))

        return queryset.order_by(self.request.query_params.get('ordering', '-start_date'))

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

# --- ALLOWED PARTICIPANT (JOIN/UNJOIN/REMIND) ---

class AllowedParticipantViewSet(viewsets.ModelViewSet):
    queryset = AllowedParticipant.objects.all()
    serializer_class = AllowedParticipantSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]

    def perform_create(self, serializer):
        event = serializer.validated_data.get('event')
        if not event:
            raise ValidationError({"event": "Event is required."})

        if self.request.user.is_staff:
            email = self.request.data.get('email')
            if not email:
                raise ValidationError({"email": "Email is required for staff entries."})
        else:
            email = self.request.user.email

            event_roles = event.allowed_roles.all()
            if event_roles.exists():
                if not self.request.user.roles.filter(id__in=event_roles.values_list('id', flat=True)).exists():
                    raise ValidationError({"detail": "You do not have the required role for this event."})

        if event.max_participants is not None and event.allowed_participants.count() >= event.max_participants:
            raise ValidationError({"detail": "Maximum participant limit reached for this event."})

        if AllowedParticipant.objects.filter(event=event, email=email).exists():
            raise ValidationError({"detail": "You are already registered for this event."})

        instance = serializer.save(email=email)

        # TEST: 2 minutes before start
        reminder_time = event.start_date - timedelta(minutes=2)
        
        print(f"\n--- REMINDER DEBUG ---")
        print(f"Event: {event.title}")
        print(f"Start: {event.start_date}")
        print(f"Reminder Time: {reminder_time}")
        print(f"Now: {timezone.now()}")
        print(f"----------------------\n")

        if reminder_time > timezone.now():
            scheduler.add_job(
                send_reminder_email,
                trigger='date',
                run_date=reminder_time,
                args=[email, event.title, event.start_date],
                id=f"reminder_{instance.id}",
                replace_existing=True
            )

    @action(detail=False, methods=['post'], url_path='unjoin')
    def unjoin(self, request):
        event_id = request.data.get('event')
        if not event_id:
            return Response({"error": "Event ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        user_email = request.user.email
        registration = AllowedParticipant.objects.filter(event_id=event_id, email=user_email).first()
        
        if registration:
            job_id = f"reminder_{registration.id}"
            try:
                scheduler.remove_job(job_id)
            except:
                pass
            
            registration.delete()
            return Response({"message": "Successfully unregistered."}, status=status.HTTP_200_OK)
        
        return Response({"error": "Not registered."}, status=status.HTTP_404_NOT_FOUND)