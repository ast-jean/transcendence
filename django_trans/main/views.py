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
    return redirect('home')

def logout_view(request):
    logout(request)
    request.session.flush() 
    return redirect('home')

def profile(request):
    token = request.session.get('oauth_token')

    oauth = OAuth2Session(CLIENT_ID, token=token)
    response = oauth.get('https://api.intra.42.fr/v2/me')
    profile_data = response.json()

    # Fetch or create profile in the database
    profile_db, created = Profile.objects.get_or_create(
        login = profile_data['login'],
        defaults={
            'name': profile_data.get('name', ''),
            'email': profile_data.get('email', '')
        }
    )

    # Update profile if it exists but login might not be updated
    if not created:
        profile_db.name = profile_data.get('name', profile_db.name)
        profile_db.email = profile_data.get('email', profile_db.email)
        profile_db.login = profile_data.get('login', profile_db.login)
        profile_db.save()

    #Fetch match results
    user_login = profile_data['login']
    match_results = OnlineMatchResults.objects.filter(
        models.Q(winner=user_login) | models.Q(loser=user_login)
    )

    return render(request, 'profile.html', {'profile': profile_data, 'profile_db' : profile_db, 'match_results' : match_results})