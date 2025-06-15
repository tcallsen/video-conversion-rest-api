#! /bin/bash

#stops all containers, deletes them along with associated images
docker stop video-conversion-rest-api
docker rm video-conversion-rest-api
docker image rm video-conversion-rest-api:latest

docker volume remove video-conversion-rest-api-workdir
