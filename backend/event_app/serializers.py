from rest_framework import serializers
from django.utils import timezone
from .models import (
    CustomUser, Role, Event, EventImage,
    EventAllowedEmail, EventRegistration,
    EventAgenda, EventAccessToken
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
            is_active=False
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)



class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'



class EventAllowedEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAllowedEmail
        fields = ['id', 'email', 'group_name']


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ['id', 'email', 'status', 'registered_at']


class EventAgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAgenda
        fields = ['id', 'title', 'start_time', 'end_time', 'speaker']


class EventAccessTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAccessToken
        fields = ['id', 'email', 'token', 'expires_at']


class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = '__all__'


class EventSerializer(serializers.ModelSerializer):
    allowed_roles = RoleSerializer(many=True, read_only=True)
    allowed_roles_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), many=True, write_only=True, source='allowed_roles'
    )

    allowed_emails = EventAllowedEmailSerializer(many=True, read_only=True)
    agenda_items = EventAgendaSerializer(many=True, read_only=True)
    registrations = EventRegistrationSerializer(many=True, read_only=True)
    images = EventImageSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'desc', 'type', 'visibility', 'created_by',
            'allowed_roles', 'allowed_roles_ids', 'allowed_emails',
            'agenda_items', 'registrations', 'images',
            'date', 'created_date', 'expired_date', 'participant_count',
            'max_participants'
        ]
        read_only_fields = ['created_by', 'participant_count']
