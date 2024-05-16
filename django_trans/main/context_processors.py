from django.db import models

def current_path(request):
    return {'current_path': request.path}
