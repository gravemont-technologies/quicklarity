// Strategic Clarity Engine - Worker Entry Point
require('dotenv').config();
const { Worker } = require('bullmq');
const { supabase } = require('./lib/supabaseClient');
const { processIntake } = require('./pipeline');
const { trackEvent } = require('./lib/posthogClient');

const REDIS_URL = process.env.REDIS_URL;
const USE_REDIS = !!REDIS_URL;

console.log('🔧 Strategic Clarity Engine Worker started');
console.log(`Mode: ${USE_REDIS ? 'Redis (BullMQ)' : 'Supabase Polling'}`);

if (USE_REDIS) {
  // BullMQ worker with Redis
  const IORedis = require('ioredis');
  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  
  const worker = new Worker('sce-jobs', async (job) => {
    const { jobId, payload, founderRole } = job.data;
    console.log(`\n📋 Processing job ${jobId} (role: ${founderRole})`);
    
    await trackEvent({
      distinctId: payload.email,
      event: 'job_started',
      properties: { jobId, founderRole },
    });
    
    await processIntake(jobId, payload, founderRole);
    
    return { success: true, jobId };
  }, {
    connection,
    concurrency: 3, // Process 3 jobs simultaneously
  });
  
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });
  
  console.log('✓ BullMQ worker ready, waiting for jobs...');
  
} else {
  // Supabase polling fallback
  console.log('✓ Starting Supabase polling mode...');
  pollSupabaseJobs();
}

// Supabase polling for jobs when Redis not available
async function pollSupabaseJobs() {
  while (true) {
    try {
      // Get oldest queued job
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (jobs && jobs.length > 0) {
        const job = jobs[0];
        const founderRole = job.input.tier || 'free';
        
        console.log(`\n📋 Processing job ${job.id} (role: ${founderRole})`);
        
        // Mark as running
        await supabase
          .from('jobs')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', job.id);
        
        // Process
        await processIntake(job.id, job.input, founderRole);
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

