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
