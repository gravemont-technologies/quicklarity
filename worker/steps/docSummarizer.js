// Step 2: Document Summarization (gpt-5-nano, with caching)
const crypto = require('crypto');
const { callOpenAI } = require('../utils/openaiClient');
const { supabase } = require('../../lib/supabaseClient');
const fs = require('fs');
const path = require('path');

async function summarizeDocs(docs, founderEmail) {
  let totalCost = 0;
  let totalTokens = 0;
  const summaries = [];
  
  // Load prompt template
  const promptPath = path.join(__dirname, '../../prompts/doc-summarize.txt');
  const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  
  const systemMatch = promptTemplate.match(/===\s*SYSTEM\s*===\s*([\s\S]*?)(?===\s*USER\s*===|$)/i);
  const userMatch = promptTemplate.match(/===\s*USER\s*===\s*([\s\S]*?)$/i);
  
  const systemPrompt = systemMatch ? systemMatch[1].trim() : '';
  const userPromptTemplate = userMatch ? userMatch[1].trim() : '';
  
  for (const doc of docs) {
    // Hash document for caching (SHA256)
    const docHash = crypto
      .createHash('sha256')
      .update(typeof doc === 'string' ? doc : JSON.stringify(doc))
      .digest('hex');
    
    // Check cache first
    const { data: cached } = await supabase
      .from('doc_summaries')
      .select('*')
      .eq('doc_hash', docHash)
      .single();
    
    if (cached) {
      console.log(`  → Cache hit for document`);
      summaries.push({
        summary: cached.summary,
        cached: true
      });
      totalTokens += cached.token_count;
      continue; // Skip LLM call, use cached
    }
    
    // Truncate content to ~800 tokens (3200 chars max)
    const docContent = typeof doc === 'string' ? doc : doc.content || '';
    const truncatedContent = docContent.slice(0, 3200);
    const estimatedTokens = Math.ceil(truncatedContent.length / 4);
    
    // Build user prompt
    const userPrompt = userPromptTemplate
      .replace(/{{filename}}/g, doc.filename || 'document')
      .replace(/{{content}}/g, truncatedContent);
    
    // Call OpenAI with gpt-5-nano (ultra-cheap summarization)
    const result = await callOpenAI({
      model: process.env.SUMMARIZATION_MODEL || 'gpt-5-nano',
      temperature: 0.1,
      maxTokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    
    totalCost += result.cost;
    totalTokens += result.usage.total_tokens;
    
    // Cache the summary
    await supabase
      .from('doc_summaries')
      .insert({
        doc_hash: docHash,
        summary: result.content.trim(),
        token_count: result.usage.total_tokens
      })
      .select()
      .single();
    
    console.log(`  → Summarized document (${estimatedTokens} tokens → ${result.usage.completion_tokens} summary tokens)`);
    
    summaries.push({
      summary: result.content.trim(),
      cached: false
    });
  }
  
  return {
    summaries,
    cost: totalCost,
    totalTokens
  };
}

module.exports = { summarizeDocs };

