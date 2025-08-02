# Node.js Video Transcoding REST API

A Node.js REST API that performs FFmpeg video conversion jobs. Developed as an alternative to the AWS Elastic Transcoder service.

The base implementation reads source video files from an AWS S3 bucket, perform transcoding via FFmpeg in a local docker container, and then writes transcoded videos back to an S3 bucket.

When video processing has completed, a optional webhook `POST` request is sent to the configured `BATCH_CALLBACK_URL` containing completed job information.

Transcoding jobs are processed sequentially one at a time in the order recieved. Specifying a `CONCURRENT_WORKER_THREADS` config value larger than 1 will allow parallel processing (in independent docker containers).

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

Once processing has completed, the transcoded video will be available in S3 at the path `${S3_BUCKET_NAME}/swap/output.mp4`, and an optional webhook will be fired to `BATCH_CALLBACK_URL` that can notify other systems.

### Transcoding Options

The FFmpeg configuration is defined in the `format` property of the `POST` body. Any transcoding options that are not provided will be populated with the following defaults:

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

Multiple conversion jobs can be provided as part of the same batch request, simply add new entries to the `POST` request body:

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

After cloning the repo, run the following commands to install dependencies:

```
nvm use
npm install
```

### Configuring

Create a `.env` file in the root of the repo based on the [.env.example](./.env.example) file and populate with the appropriate values, including AWS credentials and an option `BATCH_CALLBACK_URL` which is notified via webhook when processing completes.

### Starting

Execute the following commands to start the service and REST API:

```
npm run start
```

## Using Other Storage Providers

While the base implementation reads and writes videos to AWS S3, the [FileManager.ts](./src/types/FileManager.ts) interfaces can be re-implemented to hook up to other storage mechanisms outside of S3.
