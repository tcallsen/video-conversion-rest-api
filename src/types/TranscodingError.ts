// error classes overridden to add name property to specify type of error in response
export class TranscodingError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};

export class SourceFileError extends TranscodingError { };

export class FFmpegError extends TranscodingError { };

export class FFmpegProbeError extends TranscodingError { };

export class TargetFileError extends TranscodingError { };
