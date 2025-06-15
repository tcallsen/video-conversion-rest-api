import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

import type { FFmpegProbeResult, TranscodeJobData, TranscodeJobOptions } from '../types/TranscodeJob.ts';
import type { JobType, ProcessJobFunction } from 'simple-worker-thread-queue';

import { FFmpegError, FFmpegProbeError, SourceFileError, TargetFileError } from '../types/TranscodingError.ts';
import { prepareSourceFile, placeTargetFile } from '../fileManager/S3FileManager.ts';

// read DOCKERIZED from .env file
import { config } from 'dotenv';
config();

// use local directory if running directly on host machine; use docker volumne if running in docker container
const isRunningInDocker: boolean = process.env.DOCKERIZED === 'true';
const WORKDIR_PATH_HOST_FILESYSTEM: string = path.join(import.meta.dirname, '../../workdir');
const DOCKER_WORKDIR_VOLUME_NAME: string = 'video-conversion-rest-api-workdir';

export const processJob: ProcessJobFunction<TranscodeJobOptions, TranscodeJobData> = async function (jobOptions: TranscodeJobOptions, job: JobType<TranscodeJobOptions, TranscodeJobData>): Promise<TranscodeJobData> {
  const { format } = jobOptions;

  // prepare source file - put input file in expected location for ffmpeg to find it
  let sourceFileNameNoExt: string;
  let sourceFilePath: string | undefined = undefined;
  let convertedFilePath: string | undefined = undefined;
  try {
    sourceFileNameNoExt = `source-${job.getId()}`;
    sourceFilePath = path.join(WORKDIR_PATH_HOST_FILESYSTEM, 'source/', sourceFileNameNoExt);
    convertedFilePath = path.join(WORKDIR_PATH_HOST_FILESYSTEM, 'converted/', `${sourceFileNameNoExt}.${format.container}`);
    await prepareSourceFile(jobOptions.source, sourceFilePath);
  } catch (error) {
    cleanUpTemporaryFiles(sourceFilePath);
    throw new SourceFileError(error);
  }

  // convert file with ffmpeg docker container
  const convertCommand: string = `docker run --rm --name video-conversion-rest-api-ffmpeg-${job.getId()} -v ${isRunningInDocker ? DOCKER_WORKDIR_VOLUME_NAME : WORKDIR_PATH_HOST_FILESYSTEM}:/tmp/workdir jrottenberg/ffmpeg:7.1-alpine -y -i /tmp/workdir/source/${sourceFileNameNoExt} -b ${format.video.bitrate} -acodec ${format.audio.codec} -ab ${format.audio.bitrate} -vcodec ${format.video.codec} -filter:v "scale=width=-1:height='min(${format.video.maxHeight},ih)'" -g 30 -f ${format.container} /tmp/workdir/converted/${sourceFileNameNoExt}.${format.container}`;
  const { stderr: convertOutput, status: convertStatus } = spawnSync('docker', convertCommand.split(' ').slice(1), { encoding: 'utf8', shell: true });
  // mark job as failed if ffmpeg converstion resturns a non-zero status
  if (convertStatus !== 0) {
    cleanUpTemporaryFiles(sourceFilePath, convertedFilePath);
    throw new FFmpegError(`job failed during conversion with status ${convertStatus}; output: ${convertOutput}`);
  }

  // probe converted file to get metadata with ffmpeg docker container
  const probeCommand: string = `docker run --rm --name video-conversion-rest-api-ffprobe-${job.getId()} --entrypoint ffprobe -v ${isRunningInDocker ? DOCKER_WORKDIR_VOLUME_NAME : WORKDIR_PATH_HOST_FILESYSTEM}:/tmp/workdir jrottenberg/ffmpeg:7.1-alpine -v quiet -print_format json -show_format -show_streams -select_streams v /tmp/workdir/converted/${sourceFileNameNoExt}.${format.container}`;
  const { stdout: probeOutput, status: probeStatus } = spawnSync('docker', probeCommand.split(' ').slice(1), { encoding: 'utf8' });
  if (probeStatus !== 0) {
    cleanUpTemporaryFiles(sourceFilePath, convertedFilePath);
    throw new FFmpegError(`job failed during ffprob with status ${probeStatus}; output: ${probeOutput}`);
  }
  let probeOutputJson: FFmpegProbeResult = { streams: [], format: { duration: '0' } };
  try {
    probeOutputJson = JSON.parse(probeOutput);
  } catch (error) {
    cleanUpTemporaryFiles(sourceFilePath, convertedFilePath);
    throw new FFmpegProbeError(`job failed parsing ffprobe response with error ${error}`);
  }

  // place converted file in target location
  try {
    await placeTargetFile(convertedFilePath, jobOptions.target);
  } catch (error) {
    cleanUpTemporaryFiles(sourceFilePath, convertedFilePath);
    throw new TargetFileError(error);
  }

  // delete temporary source and converted files
  cleanUpTemporaryFiles(sourceFilePath, convertedFilePath);

  // return ffmpeg conversion and probe results, which will be saved back to job
  return { conversion: { output: convertOutput, status: convertStatus, probe: probeOutputJson } } as TranscodeJobData;
};

function cleanUpTemporaryFiles(...filePaths: (string | undefined)[]): void {
  filePaths.filter((filePath): filePath is string => filePath !== undefined).forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}
