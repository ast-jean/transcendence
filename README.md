# transcendence
# TODO:
     - [ ] Tournoi
          - [ ] Model Tournoi 
               - [ ] Games - Ajouter txt ex: Semi-finale, quart-finale, finale
               - Partie Forfeit
          - [ ] Web Server 
               - 2 niveaux
                    - Salle attentes -> joueurs arrive, joueurs finisse partie.
                         - 4 joueurs
               - Partie isolee retourne dans salle attente
     - [ ] Chat => Dans room en ligne


## Achitecture:
    - [X] Change socketio to channels.
## Game:
    - [ ] Modulable Pong matchmaking
        - [ ] Channels client comms used with chat
    - [ ] 1 vs 1 local
    - [ ] Tournament
    - [ ] 3 players+
## Player Profiles
    - [ ] Login
    - [ ] Win/Loss
    - [ ] Past games
## Chat:
    - [X] All communication in chat.
## Frontend:
    - [ ] Chat scroll down when receiving message
    - [ ] On chat focus make arrow default use. (Moveleft and right of the message)
    - [ ] *MAYBE* If we keep Global chat. Add an tab to the chat box to still access the global chat.
        ________  _________
      _| Global || Room #1 |_________
    |  ____________________________  |
    | |Me: Chat box like this      | |
    | |Xavier: Oh, okay,no problem!| |
    | |                            | |
    | |                            | |
    | |                            | |
    | |                            | |
    | |                            | |
    | |____________________________| |
    |   ___________________  _______ |
    |  | Type a message... | | Send ||
    |__| _________________ | |______||


