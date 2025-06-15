import type { Request } from 'express';
import { BASE_CONVERSION_FORMAT, type ConversionFormat, type TranscodeJobOptions } from '../types/TranscodeJob.ts';

export function parseRequestBodyToJobOptions(req: Request): TranscodeJobOptions[] {
  const parsedJobRequestData: TranscodeJobOptions[] = validateRequestBody(req);

  return parsedJobRequestData.map((transcodeJob) => {
    // format param in request is optional - create default if not provided
    const requestBodyFormat: Partial<ConversionFormat> = transcodeJob.format || {};

    // overlay any requested format options onto base converstion format
    const convertionFormat: ConversionFormat = {
      container: requestBodyFormat.container || BASE_CONVERSION_FORMAT.container,
      audio: {
        ...BASE_CONVERSION_FORMAT.audio,
        ...requestBodyFormat.audio,
      },
      video: {
        ...BASE_CONVERSION_FORMAT.video,
        ...requestBodyFormat.video,
      },
    };

    return {
      source: transcodeJob.source,
      target: transcodeJob.target,
      format: convertionFormat,
    };
  });
}

export function validateRequestBody(req: Request): TranscodeJobOptions[] {
  let requestBodyArray: TranscodeJobOptions[] = [];
  try {
    requestBodyArray = Array.isArray(req.body) ? req.body : [req.body];
    requestBodyArray.forEach((requestBody) => {
      if (!requestBody || !requestBody.source || !requestBody.target) {
        throw new Error();
      }
    });

    return requestBodyArray;
  } catch {
    throw new Error(`invalid POST body: source and target are required on single object or array of these objects`);
  }
}
