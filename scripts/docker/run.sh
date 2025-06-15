#! /bin/bash

# note: intended to be run from root of project with command: npm run docker:run

# Source the .env file if it exists
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

docker rm video-conversion-rest-api

# run docker image as container
docker run \
  --name video-conversion-rest-api \
  --network=host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v video-conversion-rest-api-workdir:/home/node/app/workdir \
  -e "REST_API_PORT=${REST_API_PORT}" \
  -e "S3_BUCKET_NAME=${S3_BUCKET_NAME}" \
  -e "AWS_REGION=${AWS_REGION}" \
  -e "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}" \
  -e "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}" \
  -e "DOCKERIZED=true" \
  video-conversion-rest-api:latest
