from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import logout
from django.shortcuts import redirect, render
from requests_oauthlib import OAuth2Session
from django.conf import settings
from django.db import models
from dotenv import load_dotenv
from .models import CustomUser, Game
import os

load_dotenv()
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
AUTHORIZATION_BASE_URL = 'https://api.intra.42.fr/oauth/authorize'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'

def home(request):
    token = request.session.get('oauth_token')
    # if not token:
    #     return redirect('oauth_login')
    oauth = OAuth2Session(CLIENT_ID, token=token)
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()
    return render(request, "home.html", {'profile': profile_data})

def pong(request):
    token = request.session.get('oauth_token')
    # if not token:
    #     return redirect('oauth_login')
    oauth = OAuth2Session(CLIENT_ID, token=token)
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()
    return render(request, "pong.html", {'profile': profile_data})

def truckleague(request):
    token = request.session.get('oauth_token')
    # if not token:
    #     return redirect('oauth_login')
    oauth = OAuth2Session(CLIENT_ID, token=token)
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()
    return render(request, "truckleague.html", {'profile': profile_data})

def about(request):
    token = request.session.get('oauth_token')
    # if not token:
    #     return redirect('oauth_login')
    oauth = OAuth2Session(CLIENT_ID, token=token)
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()
    return render(request, "about.html", {'profile': profile_data})

def get_redirect_uri(request):
    scheme = 'https' if request.is_secure() else 'http'
    host = request.get_host()
    path = reverse('callback')  # Ensure 'callback' is a named URL pattern
    return f"{scheme}://{host}{path}"

def oauth_login(request):
    redirect_uri = get_redirect_uri(request)
    oauth = OAuth2Session(CLIENT_ID, redirect_uri=redirect_uri)
    authorization_url, state = oauth.authorization_url(AUTHORIZATION_BASE_URL)
    request.session['oauth_state'] = state
    return redirect(authorization_url)

def callback(request):
    redirect_uri = get_redirect_uri(request)
    oauth = OAuth2Session(CLIENT_ID, state=request.session['oauth_state'], redirect_uri=redirect_uri)
    token = oauth.fetch_token(TOKEN_URL, client_secret=CLIENT_SECRET, authorization_response=request.build_absolute_uri())
    request.session['oauth_token'] = token
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()
    user, created = CustomUser.objects.get_or_create(
        username=profile_data['login'],
        defaults={
            'profile_data': profile_data,
        }
    )
    if not created:
        user.update_profile_data(profile_data)
    login(request, user)

    return redirect('home')

def logout_view(request):
    logout(request)
    request.session.flush() 
    return redirect('home')


def games_view(request):
    games = Game.objects.all()  # Fetch all games and related players
    context = {
        'games': games,
    }
    return render(request, 'games.html', context)


def profile(request):
    user = request.user
    games = Game.objects.filter(players__user=user).distinct()
    return render(request, 'profile.html', {'user' : user , 'profile' : user.profile_data, 'games' : games})
