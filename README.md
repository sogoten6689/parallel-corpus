

# setup
pull image node 
docker pull node:20.11.1
docker pull python:3.11

build docker compose
sudo docker compose up -d --build

sudo docker compose exec backend bash 


sudo docker compose exec backend bash alembic upgrade head
