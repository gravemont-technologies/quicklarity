import { IntakePayload, FounderProfile, LLMCall } from '../../../shared/types';
import { callLLM } from '../utils/llm-client';
import { loadPrompt } from '../utils/prompt-loader';

/**
 * Summarize founder profile using cheap model (gpt-3.5-turbo)
 * This creates a concise profile for context in later steps
 */
export async function summarizeFounderProfile(
  payload: IntakePayload
): Promise<{ profile: FounderProfile; cost: number }> {
  
  const systemPrompt = loadPrompt('profile-summarize', 'system');
  const userPrompt = loadPrompt('profile-summarize', 'user', {
    founderName: payload.founderName,
    founderEmail: payload.founderEmail,
    companyName: payload.companyName || 'Not specified',
    companyStage: payload.companyStage || 'Not specified',
    founderRole: payload.founderRole || 'Founder',
    founderSkills: (payload.founderSkills || []).join(', ') || 'Not specified',
    contextNotes: payload.contextNotes || 'None provided',
  });
  
  const llmCall: LLMCall = {
    model: process.env.SUMMARIZATION_MODEL || 'gpt-5-nano',
    temperature: parseFloat(process.env.SUMMARIZATION_TEMPERATURE || '0.1'),
    maxTokens: 200, // Short summary
    systemPrompt,
    userPrompt,
  };
  
  const response = await callLLM(llmCall);
  
  const profile: FounderProfile = {
    name: payload.founderName,
    email: payload.founderEmail,
    company: payload.companyName,
    stage: payload.companyStage,
    role: payload.founderRole,
    skills: payload.founderSkills || [],
    summary: response.content.trim(),
  };
  
  return {
    profile,
    cost: response.usage.estimatedCostUSD,
  };
}

