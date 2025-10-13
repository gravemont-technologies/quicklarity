-- Strategic Clarity Engine - Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Intake Submissions Table
-- ============================================
CREATE TABLE intake_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  
  -- Founder profile
  founder_name TEXT NOT NULL,
  founder_email TEXT NOT NULL,
  company_name TEXT,
  company_stage TEXT CHECK (company_stage IN ('idea', 'mvp', 'early-revenue', 'scaling')),
  founder_role TEXT,
  founder_skills JSONB DEFAULT '[]'::jsonb,
  
  -- Tasks and context
  tasks JSONB NOT NULL,
  context_notes TEXT,
  uploaded_docs JSONB DEFAULT '[]'::jsonb,
  
  -- Processing results
  strategic_plan JSONB,
  notion_url TEXT,
  calendar_events JSONB,
  
  -- Metadata
  llm_cost_usd NUMERIC(10,4) DEFAULT 0,
  processing_duration_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_intake_job_id ON intake_submissions(job_id);
CREATE INDEX idx_intake_status ON intake_submissions(status);
CREATE INDEX idx_intake_created_at ON intake_submissions(created_at DESC);
CREATE INDEX idx_intake_founder_email ON intake_submissions(founder_email);
CREATE INDEX idx_intake_tier ON intake_submissions(tier);

-- ============================================
-- Document Cache Table
-- ============================================
CREATE TABLE document_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_hash TEXT UNIQUE NOT NULL,
  original_filename TEXT NOT NULL,
  summary TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache lookup
CREATE INDEX idx_doc_cache_hash ON document_cache(doc_hash);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intake_submissions_updated_at
  BEFORE UPDATE ON intake_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to intake_submissions"
  ON intake_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to document_cache"
  ON document_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Founders can only read their own submissions (by email)
CREATE POLICY "Founders can read their own submissions"
  ON intake_submissions
  FOR SELECT
  TO authenticated
  USING (founder_email = auth.jwt() ->> 'email');

-- ============================================
-- Views for Analytics (Optional)
-- ============================================

CREATE OR REPLACE VIEW job_statistics AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  tier,
  status,
  COUNT(*) AS count,
  AVG(llm_cost_usd) AS avg_cost,
  AVG(processing_duration_ms) AS avg_duration_ms
FROM intake_submissions
GROUP BY DATE_TRUNC('day', created_at), tier, status
ORDER BY date DESC;

CREATE OR REPLACE VIEW cache_statistics AS
SELECT
  COUNT(*) AS total_cached_docs,
  SUM(token_count) AS total_tokens_cached,
  AVG(token_count) AS avg_tokens_per_doc,
  MAX(created_at) AS latest_cache_entry
FROM document_cache;

-- ============================================
-- Sample Data for Testing (Optional)
-- ============================================

-- Uncomment to insert sample data in development
/*
INSERT INTO intake_submissions (
  job_id,
  status,
  tier,
  founder_name,
  founder_email,
  company_name,
  company_stage,
  founder_role,
  founder_skills,
  tasks,
  llm_cost_usd
) VALUES (
  'job_sample_test_001',
  'completed',
  'free',
  'Alice Johnson',
  'alice@example.com',
  'TestCo',
  'mvp',
  'CEO',
  '["engineering", "product"]'::jsonb,
  '[{"id": "t1", "title": "Launch MVP", "description": "Get product to market"}]'::jsonb,
  0.03
);
*/

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE intake_submissions IS 'Stores all founder quiz submissions and their processing results';
COMMENT ON TABLE document_cache IS 'Caches document summaries to avoid re-summarizing identical content';
COMMENT ON COLUMN intake_submissions.job_id IS 'Unique job identifier returned to frontend';
COMMENT ON COLUMN intake_submissions.llm_cost_usd IS 'Total LLM API cost for this submission';
COMMENT ON COLUMN document_cache.doc_hash IS 'SHA-256 hash of document content for cache lookup';

