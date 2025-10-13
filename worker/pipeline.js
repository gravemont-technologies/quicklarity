// Strategic Clarity Engine - Main Processing Pipeline
const { normalizeProfile } = require('./steps/profileNormalizer');
const { summarizeDocs } = require('./steps/docSummarizer');
const { scoreTasksWithRules } = require('./scorer');
const { generateFinalPlan } = require('./steps/planGenerator');
const { publishToNotion } = require('./notionPublisher');
const { generateCalendarEvents } = require('./calendarGenerator');
const { supabase } = require('../lib/supabaseClient');
const { trackEvent } = require('../lib/posthogClient');

async function processIntake(jobId, payload, founderRole) {
  const startTime = Date.now();
  let totalCost = 0;
  const tokenMeta = {};
  
  try {
    console.log(`[${jobId}] Starting 6-step pipeline...`);
    
    // STEP 1: Profile Normalization (gpt-5-nano)
    console.log(`[${jobId}] Step 1/6: Profile normalization...`);
    const profileResult = await normalizeProfile(payload);
    totalCost += profileResult.cost;
    tokenMeta.profile_tokens = profileResult.tokens;
    console.log(`  → Cost: $${profileResult.cost.toFixed(6)}, Tokens: ${profileResult.tokens}`);
    
    // STEP 2: Document Summarization (gpt-5-nano, cached)
    const docs = payload.docs || [];
    const maxDocs = founderRole === 'paid' ? 3 : 1;
    const docsToProcess = docs.slice(0, maxDocs);
    
    if (docsToProcess.length > 0) {
      console.log(`[${jobId}] Step 2/6: Summarizing ${docsToProcess.length} document(s)...`);
      const docResult = await summarizeDocs(docsToProcess, payload.email);
      totalCost += docResult.cost;
      tokenMeta.doc_tokens = docResult.totalTokens;
      tokenMeta.doc_cached = docResult.summaries.filter(s => s.cached).length;
      console.log(`  → Cost: $${docResult.cost.toFixed(6)}, Tokens: ${docResult.totalTokens}, Cached: ${tokenMeta.doc_cached}`);
    } else {
      console.log(`[${jobId}] Step 2/6: No documents to process`);
      tokenMeta.doc_tokens = 0;
    }
    
    // STEP 3: Rule-Based Scoring (deterministic, $0)
    console.log(`[${jobId}] Step 3/6: Rule-based task scoring...`);
    const scoredTasks = scoreTasksWithRules(payload.tasks || [], profileResult.profile);
    console.log(`  → Cost: $0 (deterministic), Scored: ${scoredTasks.length} tasks`);
    
    // STEP 4: Final Plan Generation (gpt-5-mini for free, gpt-5 for paid)
    console.log(`[${jobId}] Step 4/6: Generating strategic plan...`);
    const maxTokens = founderRole === 'paid' ? 1200 : 600;
    const planResult = await generateFinalPlan(
      profileResult.profile,
      scoredTasks,
      (docsToProcess.length > 0 && docResult) ? docResult.summaries : [],
      payload,
      founderRole,
      maxTokens
    );
    totalCost += planResult.cost;
    tokenMeta.plan_tokens = planResult.tokens;
    tokenMeta.plan_model = founderRole === 'paid' ? 'gpt-5' : 'gpt-5-mini';
    console.log(`  → Cost: $${planResult.cost.toFixed(6)}, Tokens: ${planResult.tokens}, Model: ${tokenMeta.plan_model}`);
    
    // Budget check
    const budget = founderRole === 'paid' ? 1.0 : 0.05;
    if (totalCost > budget) {
      throw new Error(`Budget exceeded: $${totalCost.toFixed(4)} > $${budget}`);
    }
    
    // STEP 5: Publish to Notion
    console.log(`[${jobId}] Step 5/6: Publishing to Notion...`);
    const notionUrl = await publishToNotion(planResult.plan, payload.name);
    console.log(`  → Published: ${notionUrl}`);
    
    // STEP 6: Generate Calendar Events
    console.log(`[${jobId}] Step 6/6: Generating calendar events...`);
    const calendarResult = await generateCalendarEvents(
      planResult.plan,
      payload.calendar_oauth
    );
    console.log(`  → Created: ${calendarResult.icsLinks.length} events`);
    
    // Update job as done
    const duration = Date.now() - startTime;
    await supabase
      .from('jobs')
      .update({
        status: 'done',
        result: planResult.plan,
        notion_url: notionUrl,
        ics_links: calendarResult.icsLinks,
        cost_usd: totalCost,
        token_meta: tokenMeta,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    
    await trackEvent({
      distinctId: payload.email,
      event: 'job_completed',
      properties: {
        jobId,
        founderRole,
        cost_estimate_usd: totalCost,
        duration_ms: duration,
        plan_model: tokenMeta.plan_model,
      },
    });
    
    console.log(`[${jobId}] ✅ COMPLETE in ${duration}ms, Total cost: $${totalCost.toFixed(4)}`);
    
  } catch (error) {
    console.error(`[${jobId}] ❌ ERROR:`, error.message);
    
    await supabase
      .from('jobs')
      .update({
        status: 'errored',
        error_message: error.message,
        cost_usd: totalCost,
      })
      .eq('id', jobId);
    
    await trackEvent({
      distinctId: payload.email,
      event: 'job_failed',
      properties: {
        jobId,
        error: error.message,
        cost_at_failure: totalCost,
      },
    });
    
    throw error;
  }
}

module.exports = { processIntake };

