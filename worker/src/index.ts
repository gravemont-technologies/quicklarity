import Queue from 'bull';
import dotenv from 'dotenv';
import { processJob } from './pipeline/processor';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Connect to the same queue as API
const jobQueue = new Queue('sce-jobs', REDIS_URL);

console.log('🔧 Strategic Clarity Engine Worker started');
console.log(`Connected to Redis: ${REDIS_URL}`);

/**
 * Process jobs from the queue
 */
jobQueue.process('generate-strategic-plan', async (job) => {
  const { jobId, payload } = job.data;
  
  console.log(`📋 Processing job ${jobId} (tier: ${payload.tier})`);
  
  try {
    await processJob(jobId, payload);
    console.log(`✅ Job ${jobId} completed successfully`);
    return { success: true, jobId };
  } catch (error: any) {
    console.error(`❌ Job ${jobId} failed:`, error.message);
    throw error; // Bull will retry based on configuration
  }
});

/**
 * Event handlers for monitoring
 */
jobQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

jobQueue.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

jobQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  console.log('Shutting down worker...');
  await jobQueue.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Keep process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

