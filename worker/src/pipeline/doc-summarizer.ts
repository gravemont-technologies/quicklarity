import crypto from 'crypto';
import { UploadedDocument, DocumentSummary, LLMCall } from '../../../shared/types';
import { callLLM } from '../utils/llm-client';
import { loadPrompt } from '../utils/prompt-loader';
import { getCachedDocSummary, cacheDocSummary } from '../utils/doc-cache';

/**
 * Summarize documents using cheap model with caching
 * Hashes documents to avoid re-summarizing unchanged content
 */
export async function summarizeDocuments(
  documents: UploadedDocument[]
): Promise<{ summaries: DocumentSummary[]; cost: number }> {
  
  let totalCost = 0;
  const summaries: DocumentSummary[] = [];
  
  for (const doc of documents) {
    // Hash the document content
    const docHash = hashDocument(doc);
    
    // Check cache first
    const cached = await getCachedDocSummary(docHash);
    if (cached) {
      console.log(`Cache hit for document: ${doc.filename}`);
      summaries.push({
        filename: doc.filename,
        summary: cached.summary,
        keyInsights: extractKeyInsights(cached.summary),
        tokenCount: cached.token_count,
      });
      continue;
    }
    
    // Summarize with LLM
    console.log(`Summarizing document: ${doc.filename}`);
    
    // Decode base64 content
    const content = Buffer.from(doc.base64Content, 'base64').toString('utf-8');
    
    // Truncate if too long (to stay within budget)
    const truncatedContent = content.slice(0, 5000); // ~1250 tokens
    
    const systemPrompt = loadPrompt('doc-summarize', 'system');
    const userPrompt = loadPrompt('doc-summarize', 'user', {
      filename: doc.filename,
      content: truncatedContent,
    });
    
    const llmCall: LLMCall = {
      model: process.env.SUMMARIZATION_MODEL || 'gpt-5-nano',
      temperature: 0.1,
      maxTokens: 300, // Concise summary
      systemPrompt,
      userPrompt,
    };
    
    const response = await callLLM(llmCall);
    totalCost += response.usage.estimatedCostUSD;
    
    const summary = response.content.trim();
    const keyInsights = extractKeyInsights(summary);
    
    // Cache the result
    await cacheDocSummary(docHash, doc.filename, summary, response.usage.totalTokens);
    
    summaries.push({
      filename: doc.filename,
      summary,
      keyInsights,
      tokenCount: response.usage.totalTokens,
    });
  }
  
  return { summaries, cost: totalCost };
}

/**
 * Hash document for caching
 */
function hashDocument(doc: UploadedDocument): string {
  const hash = crypto.createHash('sha256');
  hash.update(doc.filename);
  hash.update(doc.base64Content);
  return hash.digest('hex');
}

/**
 * Extract key insights from summary (simple bullet point extraction)
 */
function extractKeyInsights(summary: string): string[] {
  const lines = summary.split('\n');
  const insights = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(line => line.length > 0);
  
  return insights.slice(0, 5); // Top 5 insights
}

