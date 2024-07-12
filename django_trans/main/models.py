from django.db import models

# Create your models here.

class ExistingUsers(models.Model):
    username = models.CharField(max_length=50)
    user_id = models.IntegerField(primary_key=True)

    class Meta:
        db_table = 'existing_users'  # Ensures Django uses the existing table

class OnlineMatchResults(models.Model):
    winner = models.CharField(max_length=50)
    loser = models.CharField(max_length=50)
    winner_id = models.IntegerField()
    loser_id = models.IntegerField()
    score = models.CharField(max_length=50)
    game_id = models.IntegerField()

    class Meta:
        db_table = 'online_match_results'  # Ensures Django uses the existing table

class AllUsers(models.Model):
    username = models.CharField(max_length=50)
    user_id = models.IntegerField(primary_key=True)

    class Meta:
        db_table = 'all_users'  # Ensures Django uses the existing table

class Profile(models.Model):
    login = models.CharField(max_length=100, unique=True)  # Adding login field
    name = models.CharField(max_length=100)
    email = models.EmailField()

    def __str__(self):
        return self.name