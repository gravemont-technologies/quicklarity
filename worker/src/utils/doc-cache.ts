import { supabase } from './supabase';

/**
 * Document caching utilities
 * Caches document summaries to avoid re-summarizing unchanged documents
 */

export interface CachedDoc {
  doc_hash: string;
  original_filename: string;
  summary: string;
  token_count: number;
}

/**
 * Get cached document summary by hash
 */
export async function getCachedDocSummary(docHash: string): Promise<CachedDoc | null> {
  const { data, error } = await supabase
    .from('document_cache')
    .select('*')
    .eq('doc_hash', docHash)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as CachedDoc;
}

/**
 * Cache document summary
 */
export async function cacheDocSummary(
  docHash: string,
  filename: string,
  summary: string,
  tokenCount: number
): Promise<void> {
  const { error } = await supabase
    .from('document_cache')
    .insert({
      doc_hash: docHash,
      original_filename: filename,
      summary,
      token_count: tokenCount,
    });
  
  if (error) {
    console.warn('Failed to cache document summary:', error);
    // Don't throw - caching is optional optimization
  }
}

