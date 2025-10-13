// Step 4: Final Plan Generation (gpt-5-mini for free, gpt-5 for paid)
const { callOpenAI } = require('../utils/openaiClient');
const fs = require('fs');
const path = require('path');

async function generateFinalPlan(profile, scoredTasks, docSummaries, payload, founderRole, maxTokens) {
  // Load prompt template
  const promptPath = path.join(__dirname, '../../prompts/plan-generation.txt');
  const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  
  const systemMatch = promptTemplate.match(/===\s*SYSTEM\s*===\s*([\s\S]*?)(?===\s*USER\s*===|$)/i);
  const userMatch = promptTemplate.match(/===\s*USER\s*===\s*([\s\S]*?)$/i);
  
  const systemPrompt = systemMatch ? systemMatch[1].trim() : '';
  let userPrompt = userMatch ? userMatch[1].trim() : '';
  
  // Build rich context for LLM
  const context = {
    founder: {
      name: profile.name,
      role: profile.role || 'Founder',
      company: profile.company || 'Startup',
      stage: profile.stage || 'idea',
      experience_years: profile.experience_years || 0,
      summary: profile.summary
    },
    tasks: scoredTasks.slice(0, 10).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      impactScore: parseFloat(task.impactScore.toFixed(1)),
      urgency: parseFloat(task.urgency.toFixed(2)),
      revenueLeverage: parseFloat(task.revenueLeverage.toFixed(2)),
      effort: task.effort || 'medium',
      dependencies: task.dependencies || []
    })),
    documents: docSummaries.map(doc => ({
      summary: doc.summary,
      cached: doc.cached
    })),
    contextNotes: payload.context_notes || 
                   (payload.biggest_unknowns || []).join('; ') || 
                   'No additional context provided',
    topGoals: payload.top_goals || []
  };
  
  userPrompt = userPrompt.replace(/{{context_json}}/g, JSON.stringify(context, null, 2));
  
  // Model selection: gpt-5 for paid (best quality), gpt-5-mini for free (ONE crucial call)
  const model = founderRole === 'paid' 
    ? (process.env.PAID_MODEL || 'gpt-5')
    : (process.env.FREE_FINAL_MODEL || 'gpt-5-mini');
  
  console.log(`  → Using model: ${model} (${founderRole} tier)`);
  
  // Call OpenAI - SINGLE HIGH-QUALITY CALL
  const result = await callOpenAI({
    model,
    temperature: 0.2,
    maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    responseFormat: { type: 'json_object' } // Force JSON output
  });
  
  // Parse JSON
  let plan;
  try {
    plan = parseAndValidatePlan(result.content);
  } catch (parseError) {
    console.warn(`  → JSON parse failed, attempting rectifier...`);
    plan = await rectifyJSON(result.content);
  }
  
  // Add metadata
  plan.metadata = {
    generatedAt: new Date().toISOString(),
    founderName: profile.name,
    totalTasks: scoredTasks.length,
    planningHorizon: '4-8 weeks',
    model: model,
    tier: founderRole
  };
  
  return {
    plan,
    cost: result.cost,
    tokens: result.usage.total_tokens
  };
}

function parseAndValidatePlan(content) {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/, '').replace(/```\s*$/, '');
  }
  
  const plan = JSON.parse(cleaned);
  
  // Validate required fields
  const required = ['executiveSummary', 'topPriorities', 'schedule', 'risks', 'nextSteps'];
  for (const field of required) {
    if (!plan[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
    if (Array.isArray(plan[field]) && field !== 'executiveSummary' && plan[field].length === 0) {
      throw new Error(`Field ${field} cannot be empty array`);
    }
  }
  
  return plan;
}

async function rectifyJSON(malformedJson) {
  console.log('  → Running JSON rectifier (gpt-5-nano)...');
  
  const promptPath = path.join(__dirname, '../../prompts/rectifier.txt');
  let promptTemplate = '';
  
  try {
    promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  } catch (err) {
    // Fallback if rectifier prompt doesn't exist
    promptTemplate = `=== SYSTEM ===
You are a JSON rectifier. The previous output was malformed JSON. Fix it by outputting ONLY valid JSON with no commentary.

=== USER ===
Malformed output:
{{malformed_json}}

Output valid JSON only.`;
  }
  
  const systemMatch = promptTemplate.match(/===\s*SYSTEM\s*===\s*([\s\S]*?)(?===\s*USER\s*===|$)/i);
  const userMatch = promptTemplate.match(/===\s*USER\s*===\s*([\s\S]*?)$/i);
  
  const systemPrompt = systemMatch ? systemMatch[1].trim() : '';
  let userPrompt = userMatch ? userMatch[1].trim() : '';
  
  userPrompt = userPrompt.replace(/{{malformed_json}}/g, malformedJson.slice(0, 4000)); // Limit
  
  const result = await callOpenAI({
    model: 'gpt-5-nano',
    temperature: 0,
    maxTokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    responseFormat: { type: 'json_object' }
  });
  
  return parseAndValidatePlan(result.content);
}

module.exports = { generateFinalPlan };

