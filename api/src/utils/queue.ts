import Queue from 'bull';
import { IntakePayload } from '../../../shared/types';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Bull queue
export const jobQueue = new Queue('sce-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

/**
 * Enqueue a job for worker processing
 */
export const enqueueJob = async (jobId: string, payload: IntakePayload) => {
  try {
    await jobQueue.add(
      'generate-strategic-plan',
      {
        jobId,
        payload,
        enqueuedAt: new Date().toISOString(),
      },
      {
        jobId, // Use jobId as Bull job ID for idempotency
        priority: payload.tier === 'paid' ? 1 : 2, // Paid users get higher priority
      }
    );
    
    console.log(`Enqueued job ${jobId} (tier: ${payload.tier})`);
  } catch (error) {
    console.error(`Failed to enqueue job ${jobId}:`, error);
    throw error;
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    jobQueue.getWaitingCount(),
    jobQueue.getActiveCount(),
    jobQueue.getCompletedCount(),
    jobQueue.getFailedCount(),
  ]);
  
  return { waiting, active, completed, failed };
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing job queue...');
  await jobQueue.close();
});

