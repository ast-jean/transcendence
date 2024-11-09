all:
	@sudo kill -9 $(sudo lsof -t -i :80 2>/dev/null) 2>/dev/null || true
	@docker compose up --build
up:
	@docker compose up --build
down:
	@docker compose -f ./docker compose.yml down
in_db:
	docker exec -it trans_db_1 bash
in_django:
	docker exec -it django bash
out:
	@echo ":kiss_mm:"

re: stop_dockers all

stop_dockers:
	@docker stop $$(docker ps -qa);\

clean: stop_dockers
	docker rm $$(docker ps -qa);\
	docker rmi -f $$(docker images -qa);\
	# docker volume rm $$(docker volume ls -q);\
	docker network rm $$(docker network ls -q);\
	docker system prune -a
	df -h 

.PHONY: all re down clean