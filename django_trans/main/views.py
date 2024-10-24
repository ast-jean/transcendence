from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AuthenticationForm
from oauthlib.oauth2 import TokenExpiredError
from requests.exceptions import RequestException
from django.contrib import messages
from django.urls import reverse
from django.contrib.auth import logout
from django.shortcuts import redirect, render, get_object_or_404
from requests_oauthlib import OAuth2Session
from django.conf import settings
from django.db import models
from dotenv import load_dotenv
from django.db.models import Count, Q
from django.http import HttpResponse
from .models import CustomUser, Game
from oauthlib.oauth2 import OAuth2Error
import jwt
from jwt.exceptions import ExpiredSignatureError
import os

load_dotenv()
CLIENT_ID = os.environ.get('CLIENT_ID')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
AUTHORIZATION_BASE_URL = 'https://api.intra.42.fr/oauth/authorize'
TOKEN_URL = 'https://api.intra.42.fr/oauth/token'

def token_saver(token):
	request.session['oauth_token'] = token
 
def home(request):
	token = request.session.get('oauth_token')

	if token:
		oauth = OAuth2Session(
			CLIENT_ID,
			token=token,
			auto_refresh_url=TOKEN_URL,
			auto_refresh_kwargs={
				'client_id': CLIENT_ID,
				'client_secret': CLIENT_SECRET,
			},
			token_updater=lambda t: request.session.update({'oauth_token': t})
		)
		try:
			response = oauth.get('https://api.intra.42.fr/v2/me')
			response.raise_for_status()
			profile_data = response.json()
		except TokenExpiredError:
			# Token has expired; remove it from the session
			request.session.pop('oauth_token', None)
			profile_data = None
		except Exception as e:
			# Handle other exceptions or errors
			request.session.pop('oauth_token', None)
			profile_data = None
	else:
		# Token is missing; remove it from the session if it exists
		request.session.pop('oauth_token', None)
		profile_data = None

	# Proceed to render the template regardless of authentication status
	return render(request, "home.html", {'profile': profile_data})

def pong(request):
	token = request.session.get('oauth_token')

	if token:
		oauth = OAuth2Session(
			CLIENT_ID,
			token=token,
			auto_refresh_url=TOKEN_URL,
			auto_refresh_kwargs={
				'client_id': CLIENT_ID,
				'client_secret': CLIENT_SECRET,
			},
			token_updater=lambda t: request.session.update({'oauth_token': t})
		)
		try:
			response = oauth.get('https://api.intra.42.fr/v2/me')
			response.raise_for_status()
			profile_data = response.json()
		except TokenExpiredError:
			# Token has expired; remove it from the session
			request.session.pop('oauth_token', None)
			profile_data = None
		except Exception as e:
			# Handle other exceptions or errors
			request.session.pop('oauth_token', None)
			profile_data = None
	else:
		# Token is missing; remove it from the session if it exists
		request.session.pop('oauth_token', None)
		profile_data = None

	# Proceed to render the template regardless of authentication status
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

	if token:
		oauth = OAuth2Session(
			CLIENT_ID,
			token=token,
			auto_refresh_url=TOKEN_URL,
			auto_refresh_kwargs={
				'client_id': CLIENT_ID,
				'client_secret': CLIENT_SECRET,
			},
			token_updater=lambda t: request.session.update({'oauth_token': t})
		)
		try:
			response = oauth.get('https://api.intra.42.fr/v2/me')
			response.raise_for_status()
			# User is authenticated
			user_data = response.json()
			context = {'user': user_data}
		except TokenExpiredError:
			# Token has expired; remove it from the session
			request.session.pop('oauth_token', None)
			context = {'user': None}
		except Exception as e:
			# Handle other exceptions or errors
			request.session.pop('oauth_token', None)
			context = {'user': None}
	else:
		# Token is missing; remove it from the session if it exists
		request.session.pop('oauth_token', None)
		context = {'user': None}

	return render(request, 'about.html', context)

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
        user, created = CustomUser.objects.get_or_create(
            username=profile_data['login'],
            defaults={'profile_data': profile_data}
        )
        # If the user already exists, update their profile data
        if not created:
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
	logout(request)
	request.session.flush() 
	return redirect('home')


def games_view(request):
	games = Game.objects.all().order_by('-id')
 # Fetch all games and related players
	context = {
		'games': games,
	}
	return render(request, 'games.html', context)


def profile(request):
    # Get the OAuth token from the session
    token = request.session.get('oauth_token')
    if not token:
        return redirect('oauth_login')

    # Create an OAuth2 session with auto-refresh capability
    oauth = OAuth2Session(
        CLIENT_ID,
        token=token,
        auto_refresh_url=TOKEN_URL,
        auto_refresh_kwargs={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        },
        token_updater=lambda t: request.session.update({'oauth_token': t})
    )

    try:
        # Fetch user profile from the OAuth provider
        response = oauth.get('https://api.intra.42.fr/v2/me')
        response.raise_for_status()
    except TokenExpiredError:
        # Token has expired; remove token and redirect to OAuth login
        request.session.pop('oauth_token', None)
        messages.warning(request, 'Your session has expired. Please log in again.')
        return redirect('oauth_login')
    except RequestException as e:
        # Handle other request exceptions or errors
        messages.error(request, f"Failed to retrieve profile information: {e}")
        return HttpResponse(f'An error occurred: {e}')
    except Exception as e:
        # General error handler
        messages.error(request, 'An unexpected error occurred. Please try again later.')
        return HttpResponse(f'An error occurred: {e}')

    # Get the authenticated user
    user = request.user
    if user.is_anonymous:
        messages.error(request, "You need to be logged in to view profiles.")
        return redirect('oauth_login')

    # Fetch user's games
    games = Game.objects.filter(players__user=user).distinct().order_by('-id')

    # Render the profile page with user and games
    return render(request, 'profile.html', {'user': user, 'profile': user.profile_data, 'games': games})

def userProfile(request, playername):
	you = request.user
	# Check if the user is anonymous
	if you.is_anonymous:
		messages.error(request, "You need to be logged in to view profiles.")
		return redirect('oauth_login')  # Redirect to login page
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
	context = {
		'them': them,
		'user': you,
		'profile': you.profile_data,
		'theirprofile': them.profile_data,
		'games': theirgames,
		'gamesWon': gamesWon,
	}
	return render(request, 'profile.html', context)