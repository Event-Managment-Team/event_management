from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid


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
            return (timezone.now() - self.otp_created_at).seconds < 300  # 5 dəqiqə
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



class EventAllowedEmail(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='allowed_emails')
    email = models.EmailField()
    group_name = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.email} for {self.event.title}"



class EventRegistration(models.Model):
    STATUS = (
        ('registered', 'Registered'),
        ('cancelled', 'Cancelled'),
    )

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    email = models.EmailField()
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS, default='registered')

    def __str__(self):
        return f"{self.email} -> {self.event.title}"



class EventAgenda(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='agenda_items')
    title = models.CharField(max_length=255)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    speaker = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.title} ({self.event.title})"



class EventAccessToken(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"Token for {self.email} -> {self.event.title}"
