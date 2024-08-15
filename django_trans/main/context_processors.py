from django.db import models
from requests_oauthlib import OAuth2Session
from requests.exceptions import RequestException
import os

def current_path(request):
    return {'current_path': request.path}


def user_profile(request):
    if request.user.is_authenticated and 'oauth_token' in request.session:
        try:
            CLIENT_ID = os.environ.get('CLIENT_ID')
            CLIENT_SECRET = os.environ.get('CLIENT_SECRET')
            TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
            token = request.session.get('oauth_token')
            oauth = OAuth2Session(CLIENT_ID, token=token)
            response = oauth.get('https://api.intra.42.fr/v2/me')
            response.raise_for_status()  # Raises an HTTPError for bad responses
            profile_data = response.json()
            return {'profile': profile_data}
        except RequestException as e:
            # Handle connection errors or handle logging here
            return {'profile': None, 'error': str(e)}
    return {}