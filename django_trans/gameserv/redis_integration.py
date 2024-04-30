import redis
import json

r = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=int(os.getenv('REDIS_DB', 0))
)

def update_player_location(room_id, player_id, x, y, z):
    location = f"{x},{y},{z}"
    r.hset(f"game_room:{room_id}", player_id, location)

def get_player_locations(room_id):
    locations = r.hgetall(f"game_room:{room_id}")
    return {player.decode('utf-8'): location.decode('utf-8') for player, location in locations.items()}

def broadcast_locations(room_id):
    locations = get_player_locations(room_id)
    r.publish(f"locations:{room_id}", json.dumps(locations))

def subscribe_to_locations(room_id):
    pubsub = r.pubsub()
    pubsub.subscribe(f"locations:{room_id}")
    for message in pubsub.listen():
        if message['type'] == 'message':
            locations = json.loads(message['data'])
            print("Updated locations:", locations)
