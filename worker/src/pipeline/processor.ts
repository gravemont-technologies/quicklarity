import { IntakePayload, StrategicPlan, CalendarEvent, CostEstimate } from '../../../shared/types';
import { updateJobStatus, getJobData } from '../utils/supabase';
import { summarizeFounderProfile } from './profile-summarizer';
import { summarizeDocuments } from './doc-summarizer';
import { scoreTasksWithRules } from '../scoring/rule-based-scorer';
import { generateStrategicPlan } from './plan-generator';
import { publishToNotion } from '../integrations/notion-client';
import { generateCalendarEvents } from '../integrations/calendar-generator';
import { trackCost, checkBudget } from '../utils/cost-tracker';

/**
 * Main job processor
 * 
 * Pipeline:
 * 1. Update status to 'processing'
 * 2. Summarize founder profile (cheap model)
 * 3. Summarize documents if present (cheap model, with caching)
 * 4. Score tasks using rule-based logic (no LLM)
 * 5. Generate strategic plan (single high-quality LLM call)
 * 6. Publish to Notion
 * 7. Generate calendar events
 * 8. Update status to 'completed'
 */
export async function processJob(jobId: string, payload: IntakePayload): Promise<void> {
  const startTime = Date.now();
  let totalCost = 0;
  
  try {
    // Step 1: Update status
    await updateJobStatus(jobId, 'processing');
    
    // Step 2: Summarize founder profile
    console.log(`[${jobId}] Summarizing founder profile...`);
    const profileResult = await summarizeFounderProfile(payload);
    totalCost += profileResult.cost;
    
    // Check budget after each expensive operation
    checkBudget(totalCost, payload.tier);
    
    // Step 3: Summarize documents (if any)
    let documentSummaries = [];
    if (payload.uploadedDocs && payload.uploadedDocs.length > 0) {
      console.log(`[${jobId}] Summarizing ${payload.uploadedDocs.length} documents...`);
      const docResult = await summarizeDocuments(payload.uploadedDocs);
      documentSummaries = docResult.summaries;
      totalCost += docResult.cost;
      checkBudget(totalCost, payload.tier);
    }
    
    // Step 4: Rule-based task scoring (no LLM cost)
    console.log(`[${jobId}] Scoring ${payload.tasks.length} tasks...`);
    const scoredTasks = scoreTasksWithRules(
      payload.tasks,
      profileResult.profile,
      payload.contextNotes
    );
    
    // Step 5: Generate strategic plan (main LLM call)
    console.log(`[${jobId}] Generating strategic plan...`);
    const planResult = await generateStrategicPlan(
      profileResult.profile,
      scoredTasks,
      documentSummaries,
      payload.contextNotes,
      payload.tier
    );
    totalCost += planResult.cost;
    checkBudget(totalCost, payload.tier);
    
    const strategicPlan: StrategicPlan = planResult.plan;
    
    // Step 6: Publish to Notion
    console.log(`[${jobId}] Publishing to Notion...`);
    const notionUrl = await publishToNotion(strategicPlan, payload.founderName);
    
    // Step 7: Generate calendar events
    console.log(`[${jobId}] Generating calendar events...`);
    const calendarEvents = await generateCalendarEvents(
      strategicPlan,
      payload.googleCalendarToken
    );
    
    // Step 8: Mark as completed
    const processingDuration = Date.now() - startTime;
    await updateJobStatus(jobId, 'completed', {
      strategic_plan: strategicPlan,
      notion_url: notionUrl,
      calendar_events: calendarEvents,
      llm_cost_usd: totalCost,
      processing_duration_ms: processingDuration,
    });
    
    console.log(`[${jobId}] Completed in ${processingDuration}ms, cost: $${totalCost.toFixed(4)}`);
    
  } catch (error: any) {
    console.error(`[${jobId}] Processing failed:`, error);
    
    // Mark as failed
    await updateJobStatus(jobId, 'failed', {
      error_message: error.message,
      llm_cost_usd: totalCost,
      processing_duration_ms: Date.now() - startTime,
    });
    
    throw error;
  }
}

