from django.urls import path
from django.conf import settings  # Add this import
from django.conf.urls.static import static
from main import views

urlpatterns = [
    path("", views.home, name='home'),
    path('Pong/', views.pong, name='Pong'),
    path('truckleague/', views.truckleague, name='Truck'),
    path('about/', views.about, name='About'),
    path('loginAPI/', views.oauth_login, name='oauth_login'),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('callback/', views.callback, name='callback'),
    path('profile/', views.profile, name='profile'),
    path('profile/<str:playername>', views.userProfile, name='userProfile'),
    path('logout/', views.logout_view, name='logout'),
    path('games/', views.games_view, name='games'),
    path('set_offline/', views.set_offline, name='set_offline')
]

# The static() function is only used during development, and it's typically conditioned on DEBUG being True
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
