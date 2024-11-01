from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class CustomUser(AbstractUser):
    oauth_token = models.JSONField(null=True, blank=True)  # Store the OAuth token
    profile_data = models.JSONField(null=True, blank=True)  # Store user profile data
    last_connected = models.DateTimeField(auto_now=True)  # Track last login time
    
    profile_data = models.JSONField(null=True, blank=True)
    alias = models.CharField(max_length=150, null=True, blank=True)
    friends = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.jpg', null=True, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)
    def update_profile_data(self, api_data):
        """Updates the profile_data field with data fetched from the API."""
        self.profile_data = api_data
        self.save()
    
    @property
    def login(self):
        return self.profile_data.get('login') if self.profile_data else None

    def add_friend(self, user):
        """Adds a user to the friends list."""
        self.friends.add(user)

    def remove_friend(self, user):
        """Removes a user from the friends list."""
        self.friends.remove(user)

    def is_friend(self, user):
        """Checks if a user is in the friends list."""
        is_friend = self.friends.filter(id=user.id).exists()
        print(f"Is {self.username} friends with {user.username}? {is_friend}")
        return is_friend

    def set_online(self):
        """Set the user as online by updating the last_active timestamp."""
        self.last_active = timezone.now()
        self.save()

    def is_online(self):
        """Check if the user is online based on the last_active timestamp."""
        if self.last_active:
            return timezone.now() - self.last_active < timezone.timedelta(minutes=2)
        return False
    
    def set_offline(self):
        """Mark the user as offline by setting last_active to None."""
        self.last_active = None
        self.save()
    
    def games_won_count(self):
        """Returns the count of games won by the user."""
        return self.player_set.filter(winner=True).count()
 
class Game(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Game N°{self.id} on {self.date.strftime('%Y-%m-%d %H:%M:%S')}"

class Player(models.Model):
    user = models.ForeignKey("CustomUser", verbose_name=_("Player"), on_delete=models.CASCADE)
    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    score = models.IntegerField()
    winner = models.BooleanField(default=False)
    team = models.IntegerField()

    def __str__(self):
        return f"{self.user.username} in {self.game.id}"