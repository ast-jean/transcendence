#/bin/bash

psql --username=$POSTGRES_USER $POSTGRES_DB <<_EOF_
CREATE TABLE IF NOT EXISTS existing_users (username bpchar(50), user_id int);
CREATE TABLE IF NOT EXISTS online_match_results (winner bpchar(50), loser bpchar(50), winner_id int, loser_id int, score int, game_id int);
CREATE TABLE IF NOT EXISTS all_users (username bpchar(50), user_id int);
_EOF_


