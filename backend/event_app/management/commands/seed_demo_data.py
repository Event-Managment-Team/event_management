from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from event_app.models import CustomUser, Role, Event, EventAgenda, AllowedParticipant


class Command(BaseCommand):
    help = "Seed demo data for local development and manual testing."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding demo data..."))

        roles = self._create_roles()
        users = self._create_users(roles)
        events = self._create_events(users, roles)
        self._create_agendas(events)
        self._create_allowed_participants(events, users)

        self.stdout.write(self.style.SUCCESS("Demo data seeding complete."))

    # --- Helpers ---

    def _create_roles(self):
        role_names = ["Student", "Teacher", "Organizer", "Volunteer"]
        roles = {}
        for name in role_names:
            role, created = Role.objects.get_or_create(name=name)
            roles[name] = role
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {name}"))
        return roles

    def _create_users(self, roles):
        users = {}

        # Frontend demo accounts (match front/App.jsx):
        # - student / student123
        # - staff / staff123
        # - admin / admin123

        admin, _ = CustomUser.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@demo.edu.az",
                "phone": "+994501111111",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        admin.is_staff = True
        admin.is_superuser = True
        admin.is_active = True
        admin.set_password("admin123")
        admin.save()
        admin.roles.set([roles["Organizer"]])
        self.stdout.write(self.style.SUCCESS("Ensured demo superuser: admin / admin123"))
        users["admin"] = admin

        staff, _ = CustomUser.objects.get_or_create(
            username="staff",
            defaults={
                "email": "staff@demo.edu.az",
                "phone": "+994502222222",
                "is_staff": True,
                "is_superuser": False,
                "is_active": True,
            },
        )
        staff.is_staff = True
        staff.is_superuser = False
        staff.is_active = True
        staff.set_password("staff123")
        staff.save()
        staff.roles.set([roles["Organizer"]])
        self.stdout.write(self.style.SUCCESS("Ensured demo staff: staff / staff123"))
        users["staff"] = staff

        student, _ = CustomUser.objects.get_or_create(
            username="student",
            defaults={
                "email": "student@cs.edu.az",
                "phone": "+994503333333",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
        )
        student.is_staff = False
        student.is_superuser = False
        student.is_active = True
        student.set_password("student123")
        student.save()
        student.roles.set([roles["Student"]])
        self.stdout.write(self.style.SUCCESS("Ensured demo student: student / student123"))
        users["student"] = student

        # Extra demo students (optional)
        student2, _ = CustomUser.objects.get_or_create(
            username="student2",
            defaults={
                "email": "student2@ee.edu.az",
                "phone": "+994504444444",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
        )
        if not student2.roles.filter(id=roles["Student"].id).exists():
            student2.roles.set([roles["Student"]])
        users["student2"] = student2

        return users

    def _create_events(self, users, roles):
        now = timezone.now()
        admin = users["admin"]

        events = {}

        public_event, created = Event.objects.get_or_create(
            title="Campus Tech Talk",
            defaults={
                "desc": "Public tech talk about modern web development.",
                "type": "offline",
                "visibility": "public",
                "created_by": admin,
                "building": "Main Building",
                "floor": 3,
                "room": "302",
                "organizer_side": "IT Club",
                "start_date": now + timedelta(days=1),
                "end_date": now + timedelta(days=1, hours=2),
                "max_participants": 100,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created public event: Campus Tech Talk"))
        public_event.allowed_roles.set([roles["Student"], roles["Teacher"], roles["Volunteer"]])
        events["public"] = public_event

        private_event, created = Event.objects.get_or_create(
            title="Leadership Workshop",
            defaults={
                "desc": "Invite-only leadership workshop for selected students.",
                "type": "offline",
                "visibility": "private",
                "created_by": admin,
                "building": "Main Building",
                "floor": 2,
                "room": "201",
                "organizer_side": "Student Affairs",
                "start_date": now + timedelta(days=2),
                "end_date": now + timedelta(days=2, hours=3),
                "max_participants": 30,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created private event: Leadership Workshop"))
        private_event.allowed_roles.set([roles["Student"], roles["Organizer"]])
        events["private"] = private_event

        # Event starting in ~30 minutes to test reminder command
        reminder_event, created = Event.objects.get_or_create(
            title="Soon Starting Event",
            defaults={
                "desc": "Event starting soon to test reminder emails.",
                "type": "offline",
                "visibility": "public",
                "created_by": admin,
                "building": "Main Building",
                "floor": 1,
                "room": "101",
                "organizer_side": "Events Office",
                "start_date": now + timedelta(minutes=30),
                "end_date": now + timedelta(hours=2),
                "max_participants": 50,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created reminder test event: Soon Starting Event"))
        reminder_event.allowed_roles.set([roles["Student"], roles["Teacher"]])
        events["reminder"] = reminder_event

        return events

    def _create_agendas(self, events):
        # Simple static times; only the time component is stored.
        agendas_spec = {
            "public": [
                ("09:00", "Opening & Welcome"),
                ("10:00", "Main Talk"),
                ("11:30", "Q&A Session"),
            ],
            "private": [
                ("14:00", "Icebreaker"),
                ("15:00", "Group Work"),
                ("16:30", "Feedback & Closing"),
            ],
        }

        for key, items in agendas_spec.items():
            event = events.get(key)
            if not event:
                continue
            for time_str, action in items:
                time_obj = timezone.datetime.strptime(time_str, "%H:%M").time()
                obj, created = EventAgenda.objects.get_or_create(
                    event=event,
                    time_slot=time_obj,
                    action=action,
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created agenda: {event.title} - {time_str} {action}"))

    def _create_allowed_participants(self, events, users):
        private_event = events.get("private")
        if not private_event:
            return

        # Support both legacy keys (student1) and the new frontend-aligned key (student).
        student1 = users.get("student") or users.get("student1")
        student2 = users.get("student2")

        if not student1 or not student2:
            return

        for user, group_name in [
            (student1, "601.21"),
            (student2, "602.21"),
        ]:
            obj, created = AllowedParticipant.objects.get_or_create(
                event=private_event,
                email=user.email,
                defaults={"group_name": group_name},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Added allowed participant {user.email} to {private_event.title}"
                ))
