from django.urls import path
from django.conf import settings  # Add this import
from django.conf.urls.static import static
from main import views

urlpatterns = [
    
    
    # Full views (fallback for non-JS users or debugging)
    path('', views.home, name='home'),
    # path('pong/', views.pong, name='pong'),
    # path('games/', views.games_view, name='games'),
    # path('profile/<str:playername>/', views.userProfile, name='userProfile'),

    #AJAX request
    path('context/profile/<str:playername>', views.get_context, name='get_context_profile'),
    path('context/<str:template_name>/', views.get_context, name='get_context'),

    # # Template 
    # path('Pong/', views.pong, name='Pong'),
    # path('truckleague/', views.truckleague, name='Truck'),
    # path('about/', views.about, name='About'),
    
    # API
    path('callback/', views.callback, name='callback'),
    path('loginAPI/', views.oauth_login, name='oauth_login'),
    
    # Auth
    path('login', views.login_view, name='login'),
    path('signup', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile data fetch
    path('profile/', views.profile, name='profile'),
    path('profile/<str:playername>', views.userProfile, name='userProfile'),
    
    # Game data fetch
    path('games/', views.games_view, name='games'),
    
    # Player activity
    path('set_offline/', views.set_offline, name='set_offline'),
    path('set_online/', views.set_online, name='set_online'),
    
    # Friend handler
    path('add_friend/<int:user_id>/', views.add_friend, name='add_friend'),
    path('remove_friend/<int:user_id>/', views.remove_friend, name='remove_friend')
]

# The static() function is only used during development, and it's typically conditioned on DEBUG being True
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
