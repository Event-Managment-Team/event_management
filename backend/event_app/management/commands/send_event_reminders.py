from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from event_app.models import Event, AllowedParticipant
from django.core.mail import send_mail

class Command(BaseCommand):
    help = 'Starts checking events and sends reminders 30 minutes before start'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        reminder_window = now + timedelta(minutes=30)
        
       
        upcoming_events = Event.objects.filter(
            start_date__gte=reminder_window - timedelta(minutes=1),
            start_date__lte=reminder_window + timedelta(minutes=1)
        )

        for event in upcoming_events:
           
            if event.visibility == 'private':
                recipients = AllowedParticipant.objects.filter(event=event).values_list('email', flat=True)
            else:
               
                recipients = [event.created_by.email] 

            if recipients:
                send_mail(
                    subject=f"Xatırlatma: {event.title} başlayır!",
                    message=f"Hörmətli iştirakçı, '{event.title}' tədbiri 30 dəqiqə sonra {event.building}, {event.room} otağında başlayacaq.",
                    from_email=None,
                    recipient_list=list(recipients),
                )
                self.stdout.write(self.style.SUCCESS(f'Reminder sent for {event.title}'))