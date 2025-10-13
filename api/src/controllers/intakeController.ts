import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { IntakePayload, IntakeResponse } from '../../../shared/types';
import { supabase } from '../utils/supabase';
import { enqueueJob } from '../utils/queue';

/**
 * Handles POST /api/intake
 * 
 * Flow:
 * 1. Generate unique jobId
 * 2. Store submission in Supabase (status: pending)
 * 3. Enqueue job for worker processing
 * 4. Return jobId to frontend
 */
export const handleIntake = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: IntakePayload = req.body;
    
    // Generate unique job ID
    const jobId = `job_${nanoid(16)}`;
    
    // Estimate completion time based on tier and complexity
    const taskCount = payload.tasks.length;
    const hasDocuments = (payload.uploadedDocs?.length || 0) > 0;
    const estimatedSeconds = calculateEstimatedTime(taskCount, hasDocuments, payload.tier);
    
    // Store in database
    const { error: dbError } = await supabase
      .from('intake_submissions')
      .insert({
        job_id: jobId,
        status: 'pending',
        tier: payload.tier,
        
        // Founder profile
        founder_name: payload.founderName,
        founder_email: payload.founderEmail,
        company_name: payload.companyName,
        company_stage: payload.companyStage,
        founder_role: payload.founderRole,
        founder_skills: payload.founderSkills || [],
        
        // Tasks and context
        tasks: payload.tasks,
        context_notes: payload.contextNotes,
        uploaded_docs: payload.uploadedDocs || [],
        
        // Metadata
        llm_cost_usd: 0,
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store submission');
    }
    
    // Enqueue job for worker
    await enqueueJob(jobId, payload);
    
    // Response
    const response: IntakeResponse = {
      success: true,
      jobId,
      message: 'Submission received. Your strategic plan is being generated.',
      estimatedCompletionTime: estimatedSeconds,
    };
    
    res.status(202).json(response);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate estimated processing time
 */
function calculateEstimatedTime(
  taskCount: number,
  hasDocuments: boolean,
  tier: 'free' | 'paid'
): number {
  let baseTime = 30; // seconds
  
  // More tasks = more time
  baseTime += taskCount * 5;
  
  // Documents add significant time
  if (hasDocuments) {
    baseTime += 45;
  }
  
  // Paid tier gets higher priority/faster processing
  if (tier === 'paid') {
    baseTime *= 0.7;
  }
  
  return Math.ceil(baseTime);
}

