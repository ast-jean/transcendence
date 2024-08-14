from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    login = models.TextField(blank=True, null=True)