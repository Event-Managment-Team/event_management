from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Role, Event, EventImage

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    list_display = (
        'username',
        'email',
        'phone',
        'is_staff',
        'is_active',
    )

    list_filter = (
        'is_staff',
        'is_superuser',
        'is_active',
    )

    search_fields = (
        'username',
        'email',
        'phone',
    )

    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        ('OTP Info', {'fields': ('otp', 'otp_created_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone', 'password1', 'password2'),
        }),
    )

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'type',
        'date',
        'created_date',
        'expired_date',
        'participant_count',
    )

    list_filter = (
        'type',
        'date',
        'expired_date',
        'allowed_roles',
    )

    search_fields = (
        'title',
        'desc',
        'agenda',
    )

    ordering = ('-created_date',)

    filter_horizontal = ('allowed_roles',)

    inlines = [EventImageInline]

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'desc', 'type')
        }),
        ('Schedule', {
            'fields': ('date', 'expired_date', 'agenda')
        }),
        ('Access Control', {
            'fields': ('allowed_roles',)
        }),
        ('Statistics', {
            'fields': ('participant_count',)
        }),
    )

@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'uploaded_at')
    list_filter = ('uploaded_at',)
