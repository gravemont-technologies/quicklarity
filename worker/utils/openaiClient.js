// OpenAI client with cost tracking and robust error handling
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 60000, // 60 seconds
});

async function callOpenAI({ model, temperature, maxTokens, messages, responseFormat }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  try {
    const params = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };
    
    if (responseFormat) {
      params.response_format = responseFormat;
    }
    
    const completion = await openai.chat.completions.create(params);
    
    const usage = completion.usage;
    const cost = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);
    
    return {
      content: completion.choices[0].message.content || '',
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      },
      cost
    };
  } catch (error) {
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your .env file.');
    } else if (error.status === 402) {
      throw new Error('OpenAI billing issue. Please add credits to your account.');
    }
    
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

function calculateCost(model, promptTokens, completionTokens) {
  let promptCostPer1k = 0.0001;
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
  
  return (promptTokens / 1000) * promptCostPer1k + (completionTokens / 1000) * completionCostPer1k;
}

module.exports = { callOpenAI };

