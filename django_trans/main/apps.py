from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError

class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'

    def ready(self):
        from django.conf import settings
        from django.contrib.auth import get_user_model
        CustomUser = get_user_model()

        try:
            # Check if the guest user already exists
            if not CustomUser.objects.filter(username='Guest').exists():
                CustomUser.objects.create_user(
                    username='Guest',
                    email='guest@example.com',
                    password='guestpassword',
                )
        except (OperationalError, ProgrammingError):
            # Skip creation if database tables are not ready
            pass