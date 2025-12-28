from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)

    def otp_is_valid(self):
        if self.otp_created_at:
            return (timezone.now() - self.otp_created_at).seconds < 300  # 5 dəqiqə
        return False

    
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Event(models.Model):
    EVENT_TYPES = (
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('hybrid', 'Hybrid'),
    )

    title = models.CharField(max_length=255)
    desc = models.TextField()

    allowed_roles = models.ManyToManyField(
        Role,
        related_name='events',
        blank=True
    )

    type = models.CharField(
        max_length=20,
        choices=EVENT_TYPES
    )

    agenda = models.TextField(blank=True, null=True)

    date = models.DateTimeField()
    created_date = models.DateTimeField(auto_now_add=True)
    expired_date = models.DateTimeField(blank=True, null=True)

    participant_count = models.PositiveIntegerField(default=0)

    def is_expired(self):
        return self.expired_date and timezone.now() > self.expired_date

    def __str__(self):
        return self.title

class EventImage(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='events/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.event.title}"