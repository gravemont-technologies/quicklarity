// Job queue client (BullMQ with Redis, or Supabase fallback)
const { Queue, Worker } = require('bullmq');
const { supabase } = require('./supabaseClient');

const REDIS_URL = process.env.REDIS_URL;
const USE_REDIS = !!REDIS_URL;

let jobQueue;

if (USE_REDIS) {
  // Use BullMQ with Redis
  const connection = require('ioredis').createClient(REDIS_URL);
  
  jobQueue = new Queue('sce-jobs', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
  
  console.log('✓ Using Redis queue');
} else {
  // Fallback to Supabase (polling-based)
  console.log('⚠ Redis not configured, using Supabase queue fallback');
  jobQueue = null;
}

async function enqueueJob(jobId, payload, founderRole) {
  if (USE_REDIS && jobQueue) {
    // Use BullMQ
    await jobQueue.add('process-intake', {
      jobId,
      payload,
      founderRole,
    }, {
      jobId, // Use jobId as unique identifier
      priority: founderRole === 'paid' ? 1 : 2, // Paid users get priority
    });
    
    console.log(`Enqueued job ${jobId} via Redis (role: ${founderRole})`);
  } else {
    // Supabase fallback: job is already in DB with status='queued'
    // Worker will poll for queued jobs
    console.log(`Job ${jobId} queued in Supabase (role: ${founderRole})`);
  }
}

module.exports = { enqueueJob, jobQueue };

