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
from django.contrib.auth import update_session_auth_hash
import os


load_dotenv()
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
AUTHORIZATION_BASE_URL = 'https://api.intra.42.fr/oauth/authorize'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'

def token_saver(token, user):
    user.oauth_token = token
    user.save()
 


def get_oauth_session(request):
    """Create or refresh an OAuth2 session with the access token from the session."""
    token = request.session.get('oauth_token')
    
    if not token:
        # No token, redirect to login
        return False
    # Initialize the OAuth2 session with auto-refresh capability
    oauth = OAuth2Session(
        settings.CLIENT_ID,
        token=token,
        auto_refresh_url=settings.TOKEN_URL,
        auto_refresh_kwargs={
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET,
        },
        token_updater=lambda t: request.session.update({'oauth_token': t})  # Save new token in session
    )

    # Try making an authenticated request to check the token status
    try:
        # This example fetches the user's profile as a check, but use the actual request as needed
        response = oauth.get('https://api.intra.42.fr/v2/me')
        response.raise_for_status()
        return oauth  # Return the session if successful

    except TokenExpiredError:
        # Token expired; remove from session and redirect to login
        request.session.pop('oauth_token', None)
        messages.warning(request, 'Your session has expired. Please log in again.')
        print(f"\033[91m[DEBUG]Expired Token in get_oauth\033[0m")
        return False

    except RequestException as e:
        messages.error(request, f"Failed to retrieve profile information: {e}")
        print(f"\033[91m[DEBUG]NO Auth info\033[0m")
        return False

def home(request):
    try:
        # Use locally stored profile data if it exists
        if request.user.is_authenticated and request.user.profile_data:
            profile_data = request.user.profile_data
            print(f"\033[94m[DEBUG]User.is_online = {request.user.is_online}\033[0m")
        else:
            # Attempt to fetch profile data using OAuth session helper
            oauth_result = get_oauth_session(request)
            if oauth_result is False:
                return render(request, "home.html")
            if hasattr(oauth_result, 'url'):
                return oauth_result  # Redirect to login or error page

            oauth, profile_data = oauth_result
            if profile_data:
                request.user.profile_data = profile_data
                request.user.save()

        print(f"\033[91m[DEBUG]NO ERROR\033[0m")
        return render(request, "home.html", {'profile': profile_data})

    except TokenExpiredError:
        request.session.pop('oauth_token', None)
        print("\033[91m[DEBUG] Token expired. Please log in again.\033[0m")
        return redirect('oauth_login')  # Redirect to login to refresh token

    except RequestException as e:
        request.session.pop('oauth_token', None)
        print(f"\033[91m[DEBUG] RequestException: {e}\033[0m")
        return render(request, "home.html")

    except Exception as e:
        print(f"\033[91m[DEBUG] Unexpected error: {e}\033[0m")
        return render(request, "home.html")
    
def pong(request):
    try:
        if request.user.is_authenticated and request.user.profile_data:
            profile_data = request.user.profile_data
        else:
            oauth_result = get_oauth_session(request)
            if oauth_result is False:
                return render(request, "pong.html")
            if hasattr(oauth_result, 'url'):
                return oauth_result

            oauth, profile_data = oauth_result
            if profile_data:
                request.user.profile_data = profile_data
                request.user.save()

        return render(request, "pong.html", {'profile': profile_data})

    except TokenExpiredError:
        request.session.pop('oauth_token', None)
        print("\033[91m[DEBUG] Token expired. Redirecting to login.\033[0m")
        return redirect('oauth_login')

    except RequestException as e:
        request.session.pop('oauth_token', None)
        print(f"\033[91m[DEBUG] RequestException in pong: {e}\033[0m")
        return render(request, "pong.html")

    except Exception as e:
        print(f"\033[91m[DEBUG] Unexpected error in pong: {e}\033[0m")
        return render(request, "pong.html")


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
        # request.user.last_active = None  # Clear last_active timestamp for offline
        # request.user.save()
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
    try:
        user = request.user
        if not user.is_authenticated:
            # Redirect unauthenticated users to the home page or login page
            return redirect('home')

        # Use locally stored profile data
        profile_data = user.profile_data if hasattr(user, 'profile_data') else {}

        if request.method == 'POST':
            # Process both profile and password forms
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
            # Initialize empty profile and password forms if GET request
            profile_form = CustomUserChangeForm(instance=user)
            password_form = CustomUserChangeFormPassword(user=user)

        # Fetch user's games
        games = Game.objects.filter(players__user=user).distinct().order_by('-id')
        user = CustomUser.objects.annotate(games_won_count=Count('player', filter=Q(player__winner=True))).get(pk=user.pk)
        games_won = user.games_won_count
        games_lost =   games.count() - user.games_won_count
        # Build a list of friends with online status
        friends_data = [
            {'friend': friend, 'is_online': friend.is_online()} for friend in user.friends.all()
        ]

        cumulative_scores = []
        current_score = 0

        for game in games.order_by('id'):  # Ensure games are ordered chronologically
            # Check if the user is the winner in this game
            is_winner = game.players.filter(user=user, winner=True).exists()
            if is_winner:
                current_score += 1  # Win
            else:
                current_score -= 1  # Loss
            cumulative_scores.append(current_score)  # Append the score after each game

        # Generate game indices for the graph
        game_indices = list(range(1, len(cumulative_scores) + 1))
        
        return render(request, 'profile.html', {
            'user': user,
            'profile': profile_data,
            'games': games,
            'gamesWon': games_won,
            'gamesLost': games_lost,
            'profile_form': profile_form,
            'password_form': password_form,
            'cumulative_scores': cumulative_scores,
            'game_indices': game_indices,
            'is_online': True,  # User's own online status
            'friends': friends_data  # Pass the list of friends with their online statuses
        })

    except TokenExpiredError:
        request.session.pop('oauth_token', None)
        print("\033[91m[DEBUG] Token expired. Redirecting to home.\033[0m")
        return redirect('home')  # Redirect to home if token expired

    except RequestException as e:
        print(f"\033[91m[DEBUG] RequestException: {e}\033[0m")
        return redirect('home')  # Redirect to home for request errors

    except Exception as e:
        print(f"\033[91m[DEBUG] Unexpected error: {e}\033[0m")
        return redirect('home')  # Redirect to home for unexpected errors

def userProfile(request, playername):
    you = request.user
    if you.is_anonymous:
        return redirect('home')
    if you.username == playername:
        return redirect('profile')
    them = get_object_or_404(
        CustomUser.objects.annotate(
            games_won_count=Count('player', filter=Q(player__winner=True))
        ),
        username=playername
    )
    theirgames = Game.objects.filter(players__user=them).distinct().order_by('id')  # Ascending order for cumulative scores
    gamesWon = them.games_won_count
    gamesLost = theirgames.count() - gamesWon
    cumulative_scores = []
    current_score = 0
    for game in theirgames:
        # Check if the user is the winner in this game
        is_winner = game.players.filter(user=them, winner=True).exists()
        if is_winner:
            current_score += 1 
        else:
            current_score -= 1 
        cumulative_scores.append(current_score) 
    game_indices = list(range(1, len(cumulative_scores) + 1))
    is_friend = you.is_friend(them) if hasattr(you, 'is_friend') else False
    is_online = them.is_online() if hasattr(them, 'is_online') else False

    context = {
        'them': them,
        'user': you,
        'profile': getattr(you, 'profile_data', {}),
        'theirprofile': getattr(them, 'profile_data', {}),
        'games': theirgames,
        'gamesWon': gamesWon,
        'cumulative_scores': cumulative_scores,
        'game_indices': game_indices,
        'gamesLost': gamesLost,
        'is_friend': is_friend,
        'is_online': is_online,
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