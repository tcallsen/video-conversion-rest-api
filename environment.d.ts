declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REST_API_PORT: string
      S3_BUCKET_NAME: string
      AWS_REGION: string
      AWS_ACCESS_KEY_ID: string
      AWS_SECRET_ACCESS_KEY: string
      BATCH_CALLBACK_URL: string
      DOCKERIZED: string
      CONCURRENT_WORKER_THREADS: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
