# transcendence
## Modules
### Web
- [X] Major Module - Django
- [X] Minor Module - Bootstrap
- [x] Minor Module - PostgreSQL
### User Management
- [X] Major Module - Standard User Management
    - [X] Users can subscribe to the website in a secure way.
    - [X] Registered users can log in in a secure way.
    - [X] Users can select a unique display name to play the tournaments.
    - [X] Users can update their information.
    - [X] Users can upload an avatar, with a default option if none is provided.
    - [X] Users can add others as friends and view their online status.
    - [X] User profiles display stats, such as wins and losses.
    - [X] Each user has a Match History including 1v1 games, dates, and relevant details, accessible to logged-in users
- [X] Major Module - OAuth 2.0 42
    - [X] Integrate the authentication system, allowing users to securely sign in.
    - [X] Obtain the necessary credentials and permissions from the authority to enable a secure login.
    - [X] Implement user-friendly login and authorization flows that adhere to best practices and security standards.
    - [X] Ensure the secure exchange of authentication tokens and user information between the web application and the authentication provider
### Gameplay
- [X] Major Module - Remote players
    It is possible to have two distant players. Each player is located on a separated computer, accessing the same website and playing the same Pong game
- [X] Major Module - Multiple players
    It is possible to have more than two players. Each player needs a live control (so the previous “Distant players” module is highly recommanded). It’s up to you to define how the game could be played with 3, 4, 5, 6 ... players. Along with the regular 2 players game, you can choose a single number of players, greater than 2, for this multiplayer module. Ex: 4 players can play on a squarred board, each player owns one unique side of the square.
- [X] Major module - Add Another Game with User History and Matchmaking.
    In this major module, the objective is to introduce a new game, distinct from Pong, and incorporate features such as user history tracking and matchmaking. Key features and goals include:
    - [X] Develop a new, engaging game to diversify the platform’s offerings and entertain users.
    - [X] Implement user history tracking to record and display individual user’s gameplay statistics.
    - [X] Create a matchmaking system to allow users to find opponents and participate in fair and balanced matches.
    - [X] Ensure that user game history and matchmaking data are stored securely and remain up-to-date.
    - [X] Optimize the performance and responsiveness of the new game to provide an enjoyable user experience. Regularly update and maintain the game to fix bugs, add new features, and enhance gameplay
- [ ] Major module - Chat
    You have to create a chat for your users in this module:
    - [X] The user should be able to send direct messages to other users.
    - [X] The user should be able to block other users. This way, they will see no more messages from the account they blocked.
    - [X] The user should be able to invite other users to play a Pong game through the chat interface.
    - [ ] The tournament system should be able to warn users expected for the next game.
    - [X] The user should be able to access other players profiles through the chat interface.
### AI-Algo
- [ ] Major Module - Introduce an AI Opponent  
    In this module, your objective is to incorporate an AI player into the game. Notably, the use of the A* algorithm is not permitted for this task. Key features and goals include:  
    - [X] Develop an AI opponent that provides a challenging and engaging gameplay experience for users.  
    - [X] The AI must replicate human behavior by simulating keyboard input. The AI can only refresh its view of the game once per second, requiring it to anticipate bounces and other actions.  
    - [X] Implement AI logic and decision-making processes that enable the AI player to make intelligent and strategic moves.  
    - [ ] Explore alternative algorithms and techniques to create an effective AI player without relying on A*.  
    - [X] Ensure the AI adapts to different gameplay scenarios and user interactions.  
    - [X] During evaluation, you must explain in detail how your AI functions. The AI must have the capability to win occasionally, and creating an AI that does nothing is strictly prohibited.  
### Gaming
- [ ] Minor Module - User and Game Stats Dashboards  
    In this module, the goal is to introduce dashboards that display statistics for individual users and game sessions. Key features and objectives include:  
    - [X] Create user-friendly dashboards that provide users with insights into their own gaming statistics.  
    - [ ] Develop a separate dashboard for game sessions, showing detailed statistics, outcomes, and historical data for each match.  
    - [ ] Ensure that the dashboards offer an intuitive and informative user interface for tracking and analyzing data.  
    - [ ] Implement data visualization techniques, such as charts and graphs, to present statistics in a clear and visually appealing manner.  
    - [X] Allow users to access and explore their own gaming history and performance metrics conveniently.  
    - [X] Feel free to add any metrics you deem useful.
- [ ] Major Module - Add Another Game with User History and Matchmaking  
    In this module, the objective is to introduce a new game, distinct from Pong, and incorporate features such as user history tracking and matchmaking. Key features and goals include:  
    - [X] Develop a new, engaging game to diversify the platform’s offerings and entertain users.  
    - [ ] Implement user history tracking to record and display individual users’ gameplay statistics.  
    - [ ] Create a matchmaking system to allow users to find opponents and participate in fair and balanced matches.  
    - [ ] Ensure that user game history and matchmaking data are stored securely and remain up-to-date.  
    - [ ] Optimize the performance and responsiveness of the new game to provide an enjoyable user experience.  
    - [ ] Regularly update and maintain the game to fix bugs, add new features, and enhance gameplay.
### Graphics
- [X] Major Module - Implementing Advanced 3D Techniques  
    This module, known as "Graphics," focuses on enhancing the visual aspects of the Pong game by utilizing advanced 3D techniques with ThreeJS/WebGL to create a more immersive gaming experience. Key features and goals include:  
    - [X] Advanced 3D Graphics: Implement advanced 3D graphics techniques to elevate the visual quality of the Pong game. Utilize ThreeJS/WebGL to create stunning visual effects that immerse players in the gaming environment.  
    - [X] Immersive Gameplay: Enhance the overall gameplay experience by providing users with a visually engaging and captivating Pong game.  
    - [X] Technology Integration: Use ThreeJS/WebGL to create the 3D graphics, ensuring compatibility and optimal performance.  

