import { 
  FounderProfile, 
  ScoredTask, 
  DocumentSummary, 
  StrategicPlan,
  LLMCall,
  UserTier
} from '../../../shared/types';
import { callLLM } from '../utils/llm-client';
import { loadPrompt } from '../utils/prompt-loader';

/**
 * Generate strategic plan using high-quality model (gpt-4o-mini)
 * This is the ONLY expensive LLM call in the pipeline
 * 
 * Takes all preprocessed data and generates a comprehensive strategic plan
 * with strict JSON output format.
 */
export async function generateStrategicPlan(
  founderProfile: FounderProfile,
  scoredTasks: ScoredTask[],
  documentSummaries: DocumentSummary[],
  contextNotes?: string,
  tier: UserTier = 'free'
): Promise<{ plan: StrategicPlan; cost: number }> {
  
  // Prepare context for LLM
  const context = {
    founder: {
      name: founderProfile.name,
      role: founderProfile.role,
      company: founderProfile.company,
      stage: founderProfile.stage,
      skills: founderProfile.skills.join(', '),
      summary: founderProfile.summary,
    },
    tasks: scoredTasks.slice(0, 15).map(task => ({ // Top 15 tasks only
      id: task.id,
      title: task.title,
      description: task.description,
      impactScore: task.impactScore.toFixed(1),
      urgency: task.urgency.toFixed(2),
      revenueLeverage: task.revenueLeverage.toFixed(2),
      effortEstimate: task.estimatedEffort || 'medium',
      dependencies: task.dependencies || [],
    })),
    documents: documentSummaries.map(doc => ({
      filename: doc.filename,
      summary: doc.summary,
      keyInsights: doc.keyInsights,
    })),
    contextNotes: contextNotes || 'None provided',
  };
  
  const systemPrompt = loadPrompt('plan-generation', 'system');
  const userPrompt = loadPrompt('plan-generation', 'user', {
    contextJson: JSON.stringify(context, null, 2),
  });
  
  // Token limits based on tier
  const maxTokens = tier === 'paid' ? 2000 : 1200;
  
  // Model selection: gpt-5 for paid, gpt-5-mini for free (ONE crucial call)
  const model = tier === 'paid' 
    ? (process.env.PAID_MODEL || 'gpt-5')
    : (process.env.FREE_FINAL_MODEL || 'gpt-5-mini');
  
  const llmCall: LLMCall = {
    model,
    temperature: parseFloat(process.env.PLAN_TEMPERATURE || '0.2'),
    maxTokens,
    systemPrompt,
    userPrompt,
  };
  
  const response = await callLLM(llmCall);
  
  // Parse JSON output
  let plan: StrategicPlan;
  try {
    plan = parseStrategicPlan(response.content);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', response.content);
    throw new Error('LLM returned invalid JSON. Please retry.');
  }
  
  // Validate and enrich plan metadata
  plan.metadata = {
    generatedAt: new Date().toISOString(),
    founderName: founderProfile.name,
    totalTasks: scoredTasks.length,
    planningHorizon: '4-8 weeks',
    confidence: tier === 'paid' ? 'high' : 'medium',
  };
  
  return {
    plan,
    cost: response.usage.estimatedCostUSD,
  };
}

/**
 * Parse and validate LLM JSON response
 */
function parseStrategicPlan(content: string): StrategicPlan {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/, '').replace(/```\s*$/, '');
  }
  
  const parsed = JSON.parse(cleaned);
  
  // Validate required fields
  if (!parsed.executiveSummary) {
    throw new Error('Missing executiveSummary');
  }
  if (!parsed.topPriorities || !Array.isArray(parsed.topPriorities)) {
    throw new Error('Missing or invalid topPriorities');
  }
  if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
    throw new Error('Missing or invalid schedule');
  }
  if (!parsed.risks || !Array.isArray(parsed.risks)) {
    throw new Error('Missing or invalid risks');
  }
  if (!parsed.nextSteps || !Array.isArray(parsed.nextSteps)) {
    throw new Error('Missing or invalid nextSteps');
  }
  
  return parsed as StrategicPlan;
}

