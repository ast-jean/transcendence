#!/bin/bash

# Run collectstatic
python manage.py collectstatic --noinput

# Start Gunicorn
gunicorn django_trans.wsgi:application --bind 0.0.0.0:8000
