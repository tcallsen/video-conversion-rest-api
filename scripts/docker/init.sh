#! /bin/bash

# note: commands designed for Ubuntu/Debian Linux docker host; do not work on Mac OSX

# note: this script must be run as root

docker volume create video-conversion-rest-api-workdir
mkdir /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data/source
mkdir /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data/converted

# note: confirm permissions set in these commands are ok!!

chmod -R 777 /var/lib/docker/volumes/video-conversion-rest-api-workdir/_data
chmod 666 /var/run/docker.sock
