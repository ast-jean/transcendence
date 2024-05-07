#!/bin/bash

# Run collectstatic
python manage.py collectstatic --noinput

# Start Gunicorn
# gunicorn django_trans.wsgi:application --bind 0.0.0.0:8000
daphne -b 0.0.0.0 -p 8000 django_trans.asgi:application