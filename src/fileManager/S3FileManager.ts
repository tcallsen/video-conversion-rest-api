import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { PrepareSourceFileFunction, PlaceTargetFileFunction } from '../types/FileManager.ts';

import { config } from 'dotenv';
config();

// automatically loads AWS credentials from .env file
//  https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
const bareBonesS3: S3Client = new S3Client();

export const prepareSourceFile: PrepareSourceFileFunction = async (key: string, localPath: string) => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const response = await bareBonesS3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
  if (response?.Body) {
    writeFileSync(
      localPath,
      await response.Body.transformToByteArray(),
    );
  } else {
    throw new Error(`s3 response does not contain body for key: ${key}`);
  }
};

export const placeTargetFile: PlaceTargetFileFunction = async (localPath: string, targetPath: string) => {
  await bareBonesS3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: targetPath,
      Body: await readFile(localPath),
    }),
  );
};
