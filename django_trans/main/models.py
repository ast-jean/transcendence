from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
	profile_data = models.JSONField(null=True, blank=True)
	is_online = models.BooleanField(default=False) 
	def update_profile_data(self, api_data):
		"""Updates the profile_data field with data fetched from the API."""
		self.profile_data = api_data
		self.save()
	
	@property
	def login(self):
		return self.profile_data.get('login') if self.profile_data else None

	def set_online(self):
		"""Sets the user as online."""
		self.is_online = True
		self.save()

	def set_offline(self):
		"""Sets the user as offline."""
		self.is_online = False
		self.save()
	
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