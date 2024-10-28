from django.contrib import admin

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, Game, Player
from django.utils.html import format_html

class CustomUserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Profile Data'), {'fields': ('profile_data', 'alias', 'avatar', 'avatar_thumbnail')}),
        (_('Status'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_online')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'alias', 'avatar_thumbnail', 'is_online', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    readonly_fields = ['avatar_thumbnail']  # Make thumbnail readonly

    def avatar_thumbnail(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.avatar.url)
        return "No Image"

    avatar_thumbnail.short_description = 'Avatar'



class PlayerInline(admin.TabularInline):
    model = Player
    extra = 1  # Number of extra forms to display in the admin

class GameAdmin(admin.ModelAdmin):
    inlines = [PlayerInline]
    list_display = ('id', 'date')
    search_fields = ('id',)
    ordering = ('-date',)

class PlayerAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'winner', 'team', 'is_user_online')
    list_filter = ('game', 'winner', 'team', 'user__is_online')
    search_fields = ('user__username', 'game__id')
    ordering = ('game', 'team')
    def is_user_online(self, obj):
            return obj.user.is_online
    is_user_online.boolean = True
    is_user_online.admin_order_field = 'user__is_online'
    is_user_online.short_description = 'Online Status'
# Register the models with the admin site
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Game, GameAdmin)
admin.site.register(Player, PlayerAdmin)
