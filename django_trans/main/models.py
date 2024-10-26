from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    oauth_token = models.JSONField(null=True, blank=True)  # Store the OAuth token
    profile_data = models.JSONField(null=True, blank=True)  # Store user profile data
    last_connected = models.DateTimeField(auto_now=True)  # Track last login time
    
    profile_data = models.JSONField(null=True, blank=True)
    is_online = models.BooleanField(default=False) 
    alias = models.CharField(max_length=150, null=True, blank=True)
    friends = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.jpg', null=True, blank=True)
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
        return self.friends.filter(id=user.id).exists()

    def set_online(self):
        """Sets the user as online."""
        self.is_online = True
        self.save()

    def set_offline(self):
        """Sets the user as offline."""
        self.is_online = False
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