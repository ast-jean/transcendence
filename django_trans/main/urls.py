from django.urls import path
from django.conf import settings  # Add this import
from django.conf.urls.static import static
from main import views
from .views import login_view

urlpatterns = [
    path("", views.home, name='home'),
    path('login/', login_view, name='login'),
]

# The static() function is only used during development, and it's typically conditioned on DEBUG being True
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
