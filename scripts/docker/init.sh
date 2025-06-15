#! /bin/bash

docker volume create video-conversion-rest-api-workdir
mkdir /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data/source
mkdir /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data/converted

chmod -R 777 /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data
chmod 666 /var/run/docker.sock
