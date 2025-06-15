import type { BatchCompletionCallback, BatchType, JobType } from 'simple-worker-thread-queue';
import type { TranscodeJobData, TranscodeJobOptions } from '../types/TranscodeJob';

// reads BATCH_CALLBACK_URL from environment variables
import { config } from 'dotenv';
config();

export const batchCallback: BatchCompletionCallback<TranscodeJobOptions, TranscodeJobData> = async function (completedBatch: BatchType<TranscodeJobOptions, TranscodeJobData>): Promise<void> {
  console.log(`Batch ${completedBatch.getId()} callback executing`);
  // convert batch job result to AWS ETC style callback
  // eslint-disable-next-line @typescript-eslint/typedef
  const etcStylePostBody = {
    state: Object.values(completedBatch.getJobs()).every((job: JobType<TranscodeJobOptions, TranscodeJobData>) => job.getStatus() === 'completed') ? 'COMPLETED' : 'FAILED',
    version: 'https://github.com/tcallsen/video-conversion-rest-api',
    jobId: completedBatch.getId(),
    pipelineId: completedBatch.getId(),
    input: Object.values(completedBatch.getJobs()).map((job: JobType<TranscodeJobOptions, TranscodeJobData>) => ({
      key: job.getOptions().source,
    })),
    inputCount: completedBatch.getJobs().length,
    outputs: Object.values(completedBatch.getJobs()).map((job: JobType<TranscodeJobOptions, TranscodeJobData>) => ({
      id: job.getId(),
      presetId: job.getOptions().format.container,
      key: job.getOptions().target,
      status: job.getStatus() === 'completed' ? 'Complete' : 'Failed',
      duration: parseInt(job.getData().conversion?.probe?.format?.duration ?? '0', 10),
      width: job.getData().conversion?.probe?.streams[0]?.width ?? '0',
      height: job.getData().conversion?.probe?.streams[0]?.height ?? '0',
    })),
  };

  console.log(`placing batch callback to URL: '${process.env.BATCH_CALLBACK_URL}' with body:`, etcStylePostBody);

  const callbackPost: Response = await fetch(process.env.BATCH_CALLBACK_URL as string, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(etcStylePostBody),
  } as RequestInit);
  if (!callbackPost.ok) {
    console.error(`batch callback failed with status ${callbackPost.status}`);
  } else {
    console.log(`batch callback succeeded with status ${callbackPost.status}`);
  }
};
