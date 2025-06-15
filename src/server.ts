import path from 'node:path';
import express from 'express';
import type { Express, Request, Response } from 'express';

import type { BatchType, QueueOptions, QueueType, JobType } from 'simple-worker-thread-queue';
import type { TranscodeJobData, TranscodeJobOptions } from './types/TranscodeJob.ts';

import { Queue, Batch } from 'simple-worker-thread-queue';
import { batchCallback } from './callback/batchCallback.ts';
import { parseRequestBodyToJobOptions } from './utils/index.ts';

import { config } from 'dotenv';
config();

const queueOptions: QueueOptions = {
  processJobExportPath: path.join(import.meta.dirname, './worker/TranscoderWorker.ts'),
};
const jobQueue: QueueType<TranscodeJobOptions, TranscodeJobData> = new Queue<TranscodeJobOptions, TranscodeJobData>(queueOptions);

const app: Express = express();
app.use(express.json());
const port: number = parseInt(process.env.REST_API_PORT || '3000');

app.post('/create', async (req: Request, res: Response) => {
  try {
    const transcodeJobOptions: TranscodeJobOptions[] = parseRequestBodyToJobOptions(req);
    const job: JobType<TranscodeJobOptions, TranscodeJobData> = jobQueue.add(transcodeJobOptions[0]);
    res.send({ message: 'queued job', job: { id: job.getId(), status: job.getStatus(), options: job.getOptions(), data: job.getData() } });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.post('/createBatch', async (req: Request, res: Response) => {
  const batch: BatchType<TranscodeJobOptions, TranscodeJobData> = new Batch(batchCallback);
  try {
    const transcodeJobOptions: TranscodeJobOptions[] = parseRequestBodyToJobOptions(req);
    transcodeJobOptions.forEach((transcodeJob) => {
      jobQueue.addToBatch(transcodeJob, batch);
    });

    res.send({ message: 'queued jobs in batch', batch: { id: batch.getId(), status: batch.getStatus(), jobs: batch.getJobs() } });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/status', (req: Request, res: Response) => {
  res.json({
    queued: {
      count: jobQueue.getQueuedJobs().length,
      jobs: jobQueue.getQueuedJobs(),
    },
    processing: {
      count: jobQueue.getProcessingJobs().length,
      jobs: jobQueue.getProcessingJobs(),
    },
    finished: {
      count: jobQueue.getFinishedJobs().length,
      jobs: jobQueue.getFinishedJobs(),
    },
  });
});

// define fallback for all other requests
app.all('*', (req: Request, res: Response) => {
  console.log(`recieved request to non-existent path: '${req.path}' - returning 404 response`);
  res.sendStatus(404);
});

app.listen(port, () => {
  console.log(`Video Conversion Rest API listening on port ${port}`);
});
