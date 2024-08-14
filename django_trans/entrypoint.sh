#!/bin/bash

# Load environment variables from .env file or Docker Compose
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi


# Run collectstatic
python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate




# Create superuser if it doesn't exist
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
username = '$DJANGO_SU'
password = '$DJANGO_SUPW'
email = 'admin@creacanvas.ca'
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
EOF

# Start Gunicorn
# gunicorn django_trans.wsgi:application --bind 0.0.0.0:8000
daphne -b 0.0.0.0 -p 8000 django_trans.asgi:application