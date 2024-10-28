from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from .forms import CustomAuthenticationForm, SignUpForm, CustomUserChangeForm, CustomUserChangeFormPassword
from oauthlib.oauth2 import TokenExpiredError
from requests.exceptions import RequestException
from django.contrib import messages
from django.urls import reverse
from django.shortcuts import redirect, render, get_object_or_404
from requests_oauthlib import OAuth2Session
from django.conf import settings
from django.db import models
from dotenv import load_dotenv
from django.db.models import Count, Q
from django.http import HttpResponse, JsonResponse
from .models import CustomUser, Game
from oauthlib.oauth2 import OAuth2Error
import jwt
from jwt.exceptions import ExpiredSignatureError
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

import os


load_dotenv()
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
AUTHORIZATION_BASE_URL = 'https://api.intra.42.fr/oauth/authorize'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'

def token_saver(token, user):
    user.oauth_token = token
    user.save()
 

def home(request):
    # Use stored profile data if it exists
    if request.user.is_authenticated and request.user.profile_data:
        profile_data = request.user.profile_data
    else:
        # Attempt to retrieve profile data from the API if no local data is available
        token = request.session.get('oauth_token')
        if token:
            oauth = OAuth2Session(CLIENT_ID, token=token, auto_refresh_url=TOKEN_URL, auto_refresh_kwargs={
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
            }, token_updater=lambda t: request.session.update({'oauth_token': t}))

            try:
                # Make an authenticated request to fetch updated profile data
                response = oauth.get('https://api.intra.42.fr/v2/me')
                response.raise_for_status()
                profile_data = response.json()
                
                # Update the user profile data in the database
                request.user.profile_data = profile_data
                request.user.save()
            except TokenExpiredError:
                # Handle token expiration: redirect to login to refresh session
                messages.error(request, "Your session has expired. Please log in again.")
                return redirect('oauth_login')
            except RequestException as e:
                # Handle other request errors gracefully
                messages.error(request, f"An error occurred while retrieving profile data: {e}")
                profile_data = None
        else:
            profile_data = None

    return render(request, "home.html", {'profile': profile_data})

def pong(request):
    # Use stored profile data if it exists
    if request.user.is_authenticated and request.user.profile_data:
        profile_data = request.user.profile_data
    else:
        # Attempt to retrieve profile data from the API if no local data is available
        token = request.session.get('oauth_token')
        if token:
            oauth = OAuth2Session(CLIENT_ID, token=token, auto_refresh_url=TOKEN_URL, auto_refresh_kwargs={
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
            }, token_updater=lambda t: request.session.update({'oauth_token': t}))

            try:
                # Make an authenticated request to fetch updated profile data
                response = oauth.get('https://api.intra.42.fr/v2/me')
                response.raise_for_status()
                profile_data = response.json()
                
                # Update the user profile data in the database
                request.user.profile_data = profile_data
                request.user.save()
            except TokenExpiredError:
                # Handle token expiration: redirect to login to refresh session
                messages.error(request, "Your session has expired. Please log in again.")
                return redirect('oauth_login')
            except RequestException as e:
                # Handle other request errors gracefully
                messages.error(request, f"An error occurred while retrieving profile data: {e}")
                profile_data = None
        else:
            profile_data = None

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
    profile_data = request.user.profile_data if request.user.is_authenticated else None
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
    try:
        # Get the redirect URI dynamically
        redirect_uri = get_redirect_uri(request)
        # Recreate the OAuth2 session with the state stored in the session
        oauth = OAuth2Session(CLIENT_ID, state=request.session['oauth_state'], redirect_uri=redirect_uri)
        # Fetch the token using the authorization response and client secret
        token = oauth.fetch_token(
            TOKEN_URL,
            client_secret=CLIENT_SECRET,
            authorization_response=request.build_absolute_uri()
        )
        # Store the OAuth token in the session
        request.session['oauth_token'] = token
        # Retrieve user profile data from the OAuth provider
        response = oauth.get('https://api.intra.42.fr/v2/me')
        response.raise_for_status()  # Raise an error for bad responses
        profile_data = response.json()
        # Get or create the user in the database based on profile data
        user, created = CustomUser.objects.get_or_create(username=profile_data['login'])
        user.profile_data = profile_data
        token_saver(token, user)  # Save the token and profile data to the user
        # If the user already exists, update their profile data
        user.set_online()
        if not created:
            user.email = profile_data['email']
            user.profile_data = profile_data  # Assuming profile_data is a field in CustomUser
            user.save()
        # Log the user in
        login(request, user)
        # Redirect to the home page
        return redirect('home')
    except OAuth2Error as e:
        # Handle OAuth2-specific errors
        messages.error(request, f"OAuth2 error: {e}")
        return redirect('oauth_login')
    except RequestException as e:
        # Handle network-related errors
        messages.error(request, f"Network error while fetching profile: {e}")
        return redirect('oauth_login')
    except KeyError:
        # Handle missing session state or token errors
        messages.error(request, "Session state mismatch. Please try logging in again.")
        return redirect('oauth_login')
    except Exception as e:
        # Handle unexpected errors
        messages.error(request, f"An unexpected error occurred: {e}")
        return redirect('oauth_login')

def logout_view(request):
    # Mark the user as offline
    if request.user.is_authenticated:
        request.user.set_offline()
    # Log the user out
    logout(request)
    return redirect('home')

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                user.set_online() 
                login(request, user)
                return redirect('home')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = CustomAuthenticationForm()
    return render(request, 'login.html', {'form': form})
@csrf_exempt
@login_required
def set_online(request):
    if request.method == "POST":
        request.user.set_online()  # Updates last_active timestamp
        return JsonResponse({"status": "User set to online"})
    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
@login_required
def set_offline(request):
    if request.method == "POST":
        request.user.last_active = None  # Clear last_active timestamp for offline
        request.user.save()
        return JsonResponse({"status": "User set to offline"})
    return JsonResponse({"error": "Invalid request method"}, status=405)

def signup_view(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            user.set_online() 
            login(request, user)
            return redirect('home')
    else:
        form = SignUpForm()
    return render(request, 'signup.html', {'form': form})


def games_view(request):
    games = Game.objects.all().order_by('-id')
 # Fetch all games and related players
    context = {
        'games': games,
    }
    return render(request, 'games.html', context)

def profile(request):
    from django.contrib.auth import update_session_auth_hash
    user = request.user
    if not user.is_authenticated:
        # messages.error(request, "You need to be logged in to view this page.")
        return redirect('home')  # Customize as needed
    profile_data = user.profile_data  # Retrieve profile data directly from the user's record

    # Determine if the logged-in user is viewing their own profile
    is_own_profile = True  # Since this is the user's own profile view

    if request.method == 'POST':
        profile_form = CustomUserChangeForm(request.POST, request.FILES, instance=user)
        password_form = CustomUserChangeFormPassword(request.POST, user=user)

        # Process profile form independently
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, "Your profile information has been updated!")

        # Process password form independently
        if password_form.is_valid():
            password_form.save()
            update_session_auth_hash(request, user)  # Keep the user logged in after password change
            messages.success(request, "Your password has been updated!")

        # If either form is valid, redirect to profile
        if profile_form.is_valid() or password_form.is_valid():
            return redirect('profile')
    else:
        profile_form = CustomUserChangeForm(instance=user)
        password_form = CustomUserChangeFormPassword(user=user)

    # Fetch user's games
    games = Game.objects.filter(players__user=user).distinct().order_by('-id')
    return render(request, 'profile.html', {
        'user': user,
        'profile': profile_data,
        'games': games,
        'profile_form': profile_form,
        'password_form': password_form,
        'is_own_profile': is_own_profile,
        'is_online': True,
        'friends': [
        {'friend': friend, 'is_online': friend.is_online()} for friend in request.user.friends.all()
    ]
    })

def userProfile(request, playername):
    you = request.user
    # Check if the user is anonymous
    if you.is_anonymous:
        return redirect('home')

    # Redirect to /profile if the playername matches the logged-in user's username
    if you.username == playername:
        return redirect('profile')

    # Retrieve the profile being viewed
    them = get_object_or_404(
        CustomUser.objects.annotate(
            games_won_count=Count('player', filter=Q(player__winner=True))
        ),
        username=playername
    )
    # Retrieve all games the user has participated in
    theirgames = Game.objects.filter(players__user=them).distinct().order_by('-id')
    # Calculate the number of games won by the user
    gamesWon = them.games_won_count
    is_friend = you.is_friend(them)
    context = {
        'them': them,
        'user': you,
        'profile': you.profile_data,
        'theirprofile': them.profile_data,
        'games': theirgames,
        'gamesWon': gamesWon,
        'is_friend': is_friend
    }

    return render(request, 'profile-view.html', context)


@login_required
def update_profile(request):
    from django.contrib.auth import update_session_auth_hash
    if request.method == 'POST':
        form = CustomUserChangeForm(data=request.POST, files=request.FILES, user=request.user)
        
        if form.is_valid():
            form.save()
            # Update session to prevent logout after password change
            update_session_auth_hash(request, form.user)
            messages.success(request, "Your profile has been updated!")
            return redirect('profile')  # Adjust with the actual profile view name
    else:
        form = CustomUserChangeForm(user=request.user)

    return render(request, 'update_profile.html', {'form': form})

def add_friend(request, user_id):
    if request.user.is_authenticated:
        friend = get_object_or_404(CustomUser, id=user_id)
        request.user.add_friend(friend)
        request.user.save()
        messages.success(request, f"You are now friends with {friend.username}!")
    return redirect('userProfile', playername=friend.username)

def remove_friend(request, user_id):
    if request.user.is_authenticated:
        friend = get_object_or_404(CustomUser, id=user_id)
        request.user.remove_friend(friend)
        request.user.save()
        messages.success(request, f"You are no longer friends with {friend.username}.")
    return redirect('userProfile', playername=friend.username)