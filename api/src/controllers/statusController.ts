import { Request, Response, NextFunction } from 'express';
import { StatusResponse } from '../../../shared/types';
import { supabase } from '../utils/supabase';
import { NotFoundError } from '../middleware/errorHandler';

/**
 * Handles GET /api/status/:jobId
 * 
 * Returns current job status and results if completed.
 */
export const handleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    
    // Fetch from database
    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (error || !data) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }
    
    // Calculate progress based on status
    const progress = calculateProgress(data.status);
    
    // Build response
    const response: StatusResponse = {
      jobId: data.job_id,
      status: data.status,
      progress,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      processingDurationMs: data.processing_duration_ms,
    };
    
    // Add results if completed
    if (data.status === 'completed') {
      response.notionUrl = data.notion_url;
      response.calendarEvents = data.calendar_events;
      
      // Generate ICS download URLs (implement endpoint if needed)
      if (data.calendar_events && data.calendar_events.length > 0) {
        response.icsDownloadUrls = data.calendar_events.map(
          (_: any, idx: number) => `/api/calendar/${jobId}/${idx}.ics`
        );
      }
    }
    
    // Add error info if failed
    if (data.status === 'failed') {
      response.errorMessage = data.error_message;
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Estimate progress percentage based on status
 */
function calculateProgress(status: string): number {
  switch (status) {
    case 'pending':
      return 5;
    case 'processing':
      return 50;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

