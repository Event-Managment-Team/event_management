from rest_framework import serializers
from .models import (
    CustomUser, Role, Event, EventImage, EventAgenda, AllowedParticipant
)
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'phone', 'password')

    def create(self, validated_data):
        user = CustomUser(
            username=validated_data['username'],
            email=validated_data['email'],
            phone=validated_data['phone'],
            is_active=False,
        )
        user.set_password(validated_data['password'])
        user.save()

        # Assign default 'Student' role to new users
        default_role, _ = Role.objects.get_or_create(name='Student')
        user.roles.add(default_role)

        return user

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Enter your refresh token to logout")

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class AdminUserRoleSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), many=True, write_only=True, source='roles', required=False
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser',
            'roles', 'role_ids'
        ]
        read_only_fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser']

class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = ['id', 'event', 'image', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class EventAgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAgenda
        fields = ['time_slot', 'action']

class EventSerializer(serializers.ModelSerializer):
    allowed_roles = RoleSerializer(many=True, read_only=True)
    allowed_roles_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), many=True, write_only=True, source='allowed_roles',
        required=False
    )
    images = EventImageSerializer(many=True, read_only=True)
    agendas = EventAgendaSerializer(many=True, read_only=True)
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'desc', 'type', 'visibility', 'created_by',
            'building', 'floor', 'room', 'organizer_side',
            'allowed_roles', 'allowed_roles_ids', 'images', 'agendas', 'is_joined',
            'start_date', 'end_date', 'created_date', 'participant_count',
            'max_participants'
        ]
        read_only_fields = ['created_by', 'created_date', 'participant_count']

    def get_is_joined(self, obj):
        """Returns True if the current user is already registered for this event."""
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        if not request or not user or not user.is_authenticated:
            return False
            
        # Using the email related to the current user
        return obj.allowed_participants.filter(email=user.email).exists()

class AllowedParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedParticipant
        fields = ['id', 'event', 'email', 'group_name']
        read_only_fields = ['email']