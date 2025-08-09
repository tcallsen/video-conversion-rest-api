# Node.js Video Transcoding REST API

A Node.js REST API that performs FFmpeg video conversion jobs, reading and writing videos to AWS S3. Developed as an alternative to the AWS Elastic Transcoder service.

## Overview

![Diagram showing components and interactions of this Vido Transcoding REST API](./docs/Video%20Converstion%20REST%20API%20v1.drawio.svg)

Jobs submitted to a REST API are queued and then processed in separate Node.js worker threads. Transcoding is performed by FFmpeg inside a docker container.

Source video files are read from AWS S3, and then the transcoded videos are written back to the same S3 bucket. For extensibility, the [FileManager.ts](./src/types/FileManager.ts) interfaces can be re-implemented to hook up to other storage mechanisms.

When video processing has completed, an optional `POST` request (webhook) with completed job information is sent to the `BATCH_CALLBACK_URL` (if configured).

## Use

Once running, the transcoding service can be called with a cURL command similar to:

```
curl --request POST \
  --url http://localhost:3000/createBatch \
  --header 'Content-Type: application/json' \
  --data '[
    {
      "source": "swap/input.mov",
      "target": "swap/output.mp4",
      "format": {
        "video": {
          "codec": "libx264",
          "bitrate": "2500k",
          "maxHeight": "1080"
        }
      }
    }
  ]'
```

For this sample request, the transcoded video would be available in S3 at path `${S3_BUCKET_NAME}/swap/output.mp4` once processing is complete.

### Transcoding Options

The FFmpeg configuration is defined in the `format` property of the `POST` body of the REST request. Any transcoding options that are not provided will be populated with the following defaults:

```
[
  {
    ...
    "format":{
      container: 'mp4',
      audio: {
        codec: 'libfdk_aac',
        bitrate: '192k'
      },
      video: {
        codec: 'libx264',
        bitrate: '7500k',
        maxHeight: 1920
      }
    }
    ...
  }
]
```

The `container` specifies the desired video container (e.g. `mp4`, `webm`, etc.). Any video and audio codecs available to FFmpeg in the [jrottenberg/ffmpeg:7.1-alpine](https://github.com/jrottenberg/ffmpeg) docker container are supported.

Multiple conversion jobs can be provided as part of the same request, simply add multiple entries to the initial `POST` request body:

```
[
  {
    "source": "swap/input.mov",
    "target": "swap/output1.mp4",
    "format": {
      "container": "mp4",
      "video": {
        "codec": "libx264",
      }
    }
  },
  {
    "source": "swap/input.mov",
    "target": "swap/output2.webm",
    "format": {
      "container": "webm",
      "audio": {
        "codec": "libvorbis",
      },
      "video": {
        "codec": "libvpx-vp9",
      }
    }
  }
]
```

## Running the Service

### Installing Dependencies

After cloning the repo, run the following commands to install dependencies:

```
nvm use
npm install
```

In addition, the service requires a Docker runtime to be available locally (or configured in the `DOCKER_HOST` env variable).

### Configuring

Create a `.env` file in the root of the repo based on the [.env.example](./.env.example) file and populate it with the appropriate values (including AWS credentials).

### Starting

Execute the following commands to start the service and REST API:

```
npm run start
```

### Running in a Docker Container

Scripts have been provided in the [./scripts/docker](./scripts/docker) directory to help build and run this service as a Docker container.

Pleaes review these scripts before using them, especially the paths and permissions set in [./scripts/docker/init.sh](./scripts/docker/init.sh).

These scripts can be executed with:

```
# creates volumne and sets permissions - must be run as sudo
sudo npm run docker:init

# builds docker container from repo code
npm run docker:build

# runs the docker container
npm run docker:run

# removes any containers, images, and volumnes
npm run docker:clean
```

## Misc.

### Queuing Library

This service uses the [simple-worker-thread-queue](https://github.com/tcallsen/simple-worker-thread-queue) npm module to handle the queuing and execution of jobs in worker threads.

### Completion Callback POST Request

When video processing has completed, an optional `POST` request (webhook) with completed job information is sent to the configured `BATCH_CALLBACK_URL`.

This occurs only if `BATCH_CALLBACK_URL` is defined in the `.env` file.

The structure of the `POST` body for this request can be found in [./src/callback/batchCallback.ts](./src/callback/batchCallback.ts).
