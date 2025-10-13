import OpenAI from 'openai';
import { LLMCall, LLMResponse, TokenUsage, PRICING } from '../../../shared/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Call OpenAI LLM with cost tracking
 */
export async function callLLM(call: LLMCall): Promise<LLMResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: call.model,
      messages: [
        { role: 'system', content: call.systemPrompt },
        { role: 'user', content: call.userPrompt },
      ],
      temperature: call.temperature,
      max_tokens: call.maxTokens,
      response_format: call.model.includes('gpt-4') 
        ? { type: 'json_object' } // Force JSON for GPT-4 models
        : undefined,
    });
    
    const usage = completion.usage!;
    const promptTokens = usage.prompt_tokens;
    const completionTokens = usage.completion_tokens;
    const totalTokens = usage.total_tokens;
    
    // Calculate cost based on model
    const cost = calculateCost(call.model, promptTokens, completionTokens);
    
    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUSD: cost,
    };
    
    console.log(`LLM call: ${call.model}, tokens: ${totalTokens}, cost: $${cost.toFixed(4)}`);
    
    return {
      content: completion.choices[0].message.content || '',
      usage: tokenUsage,
      finishReason: completion.choices[0].finish_reason,
    };
    
  } catch (error: any) {
    console.error('LLM call failed:', error.message);
    throw new Error(`LLM API error: ${error.message}`);
  }
}

/**
 * Calculate cost based on model and token usage
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  let promptCostPer1k = 0.0001; // gpt-5-nano default
  let completionCostPer1k = 0.0002;
  
  if (model.includes('gpt-5-nano')) {
    promptCostPer1k = 0.0001;
    completionCostPer1k = 0.0002;
  } else if (model.includes('gpt-5-mini')) {
    promptCostPer1k = 0.0003;
    completionCostPer1k = 0.0006;
  } else if (model.includes('gpt-5')) {
    promptCostPer1k = 0.001;
    completionCostPer1k = 0.003;
  }
  
  const promptCost = (promptTokens / 1000) * promptCostPer1k;
  const completionCost = (completionTokens / 1000) * completionCostPer1k;
  
  return promptCost + completionCost;
}

