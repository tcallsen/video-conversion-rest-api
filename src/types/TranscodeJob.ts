import type { JobDataBase, JobOptionsBase } from 'simple-worker-thread-queue';

export interface TranscodeJobOptions extends JobOptionsBase {
  source: string
  format: ConversionFormat
  target: string
};

export interface TranscodeJobData extends JobDataBase {
  conversion?: {
    output?: string
    status?: number
    probe?: FFmpegProbeResult
  }
};

export type ConversionFormat = {
  container: string
  audio: {
    codec: string
    bitrate: string
  }
  video: {
    codec: string
    bitrate: string
    maxHeight: number
  }
};

export type FFmpegProbeResult = {
  streams: Array<{
    width: number
    height: number
    duration: string
    [key: string]: string | number
  }>
  format: {
    duration: string
    [key: string]: string | number
  }
};

export const BASE_CONVERSION_FORMAT: ConversionFormat = {
  container: 'mp4',
  audio: {
    codec: 'libfdk_aac',
    bitrate: '192k',
  },
  video: {
    codec: 'libx264',
    bitrate: '7500k',
    maxHeight: 1920,
  },
};
