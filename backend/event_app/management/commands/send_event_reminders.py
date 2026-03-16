from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from event_app.models import Event, AllowedParticipant, CustomUser
from django.core.mail import send_mail

class Command(BaseCommand):
    help = 'Tədbirin başlamasına 30 dəqiqə qalmış bildiriş göndərir'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        start_threshold = now + timedelta(minutes=25)
        end_threshold = now + timedelta(minutes=35)
        
        
        upcoming_events = Event.objects.filter(
            start_date__gte=start_threshold,
            start_date__lte=end_threshold
        )

        for event in upcoming_events:
            if event.visibility == 'private':
                
                participants = AllowedParticipant.objects.filter(
                    event=event, 
                    is_notified=False
                )
                recipients = list(participants.values_list('email', flat=True))
                
                if recipients:
                    self._send_emails(event, recipients)
                    participants.update(is_notified=True) 
            
            else:
               
                recipients = list(CustomUser.objects.filter(is_active=True).values_list('email', flat=True))
                
                
                self._send_emails(event, recipients)

    def _send_emails(self, event, recipients):
        subject = f"Xatırlatma: {event.title} başlayır!"
        message = (
            f"Hörmətli iştirakçı,\n\n"
            f"'{event.title}' tədbiri 30 dəqiqə sonra başlayacaq.\n"
            f"Məkan: {event.building}, {event.room}\n"
            f"Təşkilatçı: {event.organizer_side}\n\n"
            f"Uğurlar!"
        )
        try:
            send_mail(subject, message, None, recipients, fail_silently=False)
            self.stdout.write(self.style.SUCCESS(f'Bildiriş göndərildi: {event.title}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Xəta baş verdi: {str(e)}'))