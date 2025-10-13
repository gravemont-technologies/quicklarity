import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Update job status in database
 */
export const updateJobStatus = async (
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  additionalData?: Record<string, any>
) => {
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  if (additionalData) {
    Object.assign(updateData, additionalData);
  }
  
  const { error } = await supabase
    .from('intake_submissions')
    .update(updateData)
    .eq('job_id', jobId);
  
  if (error) {
    console.error(`Failed to update job ${jobId}:`, error);
    throw error;
  }
};

/**
 * Get job data from database
 */
export const getJobData = async (jobId: string) => {
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('job_id', jobId)
    .single();
  
  if (error) {
    console.error(`Failed to fetch job ${jobId}:`, error);
    throw error;
  }
  
  return data;
};

