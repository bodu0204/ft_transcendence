up:
	cat ./backend/app/prisma/migrations/*/*.sql > ./database/init.sql
	docker compose up --build -d

clean:
	docker compose down

fclean: clean
	docker image rm ft_transcendence-frontend
	docker image rm ft_transcendence-backend
	docker image rm ft_transcendence-database
	docker image rm ft_transcendence-proxy
	docker volume rm ft_transcendence_db-data
	docker volume rm ft_transcendence_uploade
