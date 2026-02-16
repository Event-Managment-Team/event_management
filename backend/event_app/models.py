from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    roles = models.ManyToManyField(Role, blank=True, related_name='users')

    def otp_is_valid(self):
        if self.otp_created_at:
            return (timezone.now() - self.otp_created_at).seconds < 300
        return False


class Event(models.Model):
    EVENT_TYPES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('hybrid', 'Hybrid'),
    )

    VISIBILITY = (
        ('public', 'Public'),
        ('private', 'Private'),
    )

    title = models.CharField(max_length=255)
    desc = models.TextField()

    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    visibility = models.CharField(max_length=10, choices=VISIBILITY, default='public')

    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_events')
    allowed_roles = models.ManyToManyField(Role, related_name='events', blank=True)

    agenda = models.TextField(blank=True, null=True)
    date = models.DateTimeField()
    created_date = models.DateTimeField(auto_now_add=True)
    expired_date = models.DateTimeField(blank=True, null=True)
    participant_count = models.PositiveIntegerField(default=0)
    max_participants = models.PositiveIntegerField(null=True, blank=True)

    def is_expired(self):
        return self.expired_date and timezone.now() > self.expired_date

    def __str__(self):
        return self.title


class EventImage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='events/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.event.title}"
