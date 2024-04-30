
from channels.middleware import BaseMiddleware
from urllib.parse import urlparse

class CorsMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    def __call__(self, scope):
        headers = dict(scope['headers'])
        
        if b'origin' in headers:
            origin = headers[b'origin'].decode()
            allowed_origins = ['http://localhost:3000', 'https://localhost:8000']
            if origin in allowed_origins:
                headers[b'access-control-allow-origin'] = origin.encode()
                headers[b'access-control-allow-credentials'] = b'true'
                headers[b'access-control-allow-methods'] = b'GET, POST, OPTIONS'
                headers[b'access-control-allow-headers'] = b'X-Requested-With, Content-Type'

        return super().__call__(scope)
