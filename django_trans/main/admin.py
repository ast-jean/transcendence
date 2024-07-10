from django.contrib import admin
from .models import ExistingUsers, OnlineMatchResults, AllUsers

admin.site.register(ExistingUsers)
admin.site.register(OnlineMatchResults)
admin.site.register(AllUsers)
