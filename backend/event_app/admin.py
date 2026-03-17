from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Role, Event, EventImage, EventAgenda, AllowedParticipant

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'phone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'phone')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        ('OTP Info', {'fields': ('otp', 'otp_created_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1

class EventAgendaInline(admin.TabularInline):
    model = EventAgenda
    extra = 3  

class AllowedParticipantInline(admin.TabularInline):
    model = AllowedParticipant
    extra = 5  

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title', 
        'type', 
        'visibility', 
        'building', 
        'room', 
        'start_date', 
        'participant_count' # List display-də qala bilər
    )

    list_filter = (
        'type', 
        'visibility', 
        'start_date', 
        'allowed_roles'
    )

    search_fields = (
        'title', 
        'desc', 
        'building', 
        'room'
    )

    # VACİB DÜZƏLİŞ: participant_count readonly olmalıdır!
    readonly_fields = ('created_by', 'participant_count') 
    ordering = ('-created_date',)
    filter_horizontal = ('allowed_roles',)
    
    inlines = [EventImageInline, EventAgendaInline, AllowedParticipantInline]

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'desc', 'organizer_side', 'type', 'visibility')
        }),
        ('Location Details', {
            'fields': ('building', 'floor', 'room')
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Access Control', {
            'fields': ('allowed_roles', 'max_participants')
        }),
        ('Statistics', {
            'fields': ('participant_count',), # readonly_fields-də olduğu üçün xəta verməyəcək
            'classes': ('collapse',) 
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', "id")
    search_fields = ('name',)

@admin.register(AllowedParticipant)
class AllowedParticipantAdmin(admin.ModelAdmin):
    list_display = ('email', 'event', 'group_name', 'added_at')
    list_filter = ('event', 'group_name')
    search_fields = ('email', 'group_name')