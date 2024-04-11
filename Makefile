all:
	@docker-compose -f ./docker-compose.yml up -d --build
up:
	@docker-compose up --build

down:
	@docker-compose -f ./docker-compose.yml down

re: stop_dockers all

stop_dockers:
	@docker stop $$(docker ps -qa);\

clean: stop_dockers
	docker rm $$(docker ps -qa);\
	docker rmi -f $$(docker images -qa);\
	docker volume rm $$(docker volume ls -q);\
	docker network rm $$(docker network ls -q);\
	docker system prune -a
	df -h 

.PHONY: all re down clean
