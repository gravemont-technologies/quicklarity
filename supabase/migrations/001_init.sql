-- Strategic Clarity Engine - Initial Schema
-- Run with: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- FOUNDERS TABLE
-- =====================================================
CREATE TABLE founders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'paid', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled')),
  permissions JSONB DEFAULT '{}'::jsonb,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_founders_clerk_id ON founders(clerk_id);
CREATE INDEX idx_founders_email ON founders(email);
CREATE INDEX idx_founders_role ON founders(role);

-- =====================================================
-- JOBS TABLE
-- =====================================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID REFERENCES founders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'errored')),
  input JSONB NOT NULL,
  result JSONB,
  notion_url TEXT,
  ics_links TEXT[],
  token_meta JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  cost_usd NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_founder_id ON jobs(founder_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- DOC_SUMMARIES TABLE (Caching)
-- =====================================================
CREATE TABLE doc_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID REFERENCES founders(id) ON DELETE CASCADE,
  doc_hash TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_summaries_doc_hash ON doc_summaries(doc_hash);
CREATE INDEX idx_doc_summaries_founder_id ON doc_summaries(founder_id);

-- =====================================================
-- INVITATIONS TABLE
-- =====================================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES founders(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_email ON invitations(email);

-- =====================================================
-- RATINGS TABLE (Feedback)
-- =====================================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID REFERENCES founders(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ratings_founder_id ON ratings(founder_id);
CREATE INDEX idx_ratings_job_id ON ratings(job_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_founders_updated_at
  BEFORE UPDATE ON founders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to founders"
  ON founders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to jobs"
  ON jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to doc_summaries"
  ON doc_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to invitations"
  ON invitations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to ratings"
  ON ratings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read their own data
CREATE POLICY "Users can read own founder record"
  ON founders FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can read own jobs"
  ON jobs FOR SELECT USING (founder_id IN (SELECT id FROM founders WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert own ratings"
  ON ratings FOR INSERT WITH CHECK (founder_id IN (SELECT id FROM founders WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

CREATE OR REPLACE VIEW job_stats AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  status,
  COUNT(*) AS count,
  AVG(cost_usd) AS avg_cost_usd,
  SUM(cost_usd) AS total_cost_usd
FROM jobs
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY date DESC;

CREATE OR REPLACE VIEW founder_stats AS
SELECT
  role,
  subscription_status,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_last_30d
FROM founders
GROUP BY role, subscription_status;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert test data
/*
INSERT INTO founders (clerk_id, email, name, company, role) VALUES
  ('user_test123', 'test@example.com', 'Test Founder', 'TestCo', 'free');
*/

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE founders IS 'User accounts (authenticated via Clerk)';
COMMENT ON TABLE jobs IS 'Strategic planning jobs with status tracking';
COMMENT ON TABLE doc_summaries IS 'Cached document summaries (SHA256-keyed)';
COMMENT ON TABLE invitations IS 'Referral/invitation codes';
COMMENT ON TABLE ratings IS 'User feedback (1-5 stars + text)';

COMMENT ON COLUMN founders.clerk_id IS 'Clerk user ID (unique identifier)';
COMMENT ON COLUMN founders.role IS 'User tier: free, paid, or admin';
COMMENT ON COLUMN founders.permissions IS 'Feature flags and permissions (JSON)';
COMMENT ON COLUMN jobs.token_meta IS 'Token usage and cost tracking per LLM call';
COMMENT ON COLUMN doc_summaries.doc_hash IS 'SHA256 hash of document content for caching';

