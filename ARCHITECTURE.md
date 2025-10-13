# Strategic Clarity Engine - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                    (lovable.dev / React)                        │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │ Landing Page │───▶│ Quiz Form    │───▶│ Status Poll  │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                              │
│                   (Vercel Serverless / Express)                 │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ POST /api/intake │────────▶│ Validate & Store │            │
│  └──────────────────┘         └────────┬─────────┘            │
│                                         │                       │
│  ┌──────────────────┐                  │                       │
│  │GET /api/status/:id│◀────────────────┘                      │
│  └──────────────────┘                                          │
└────────┬────────────────────────────────┬───────────────────────┘
         │                                │
         │ Enqueue Job                    │ Query Status
         ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐
│   REDIS QUEUE       │         │   SUPABASE DB       │
│   (Bull/Upstash)    │         │   (PostgreSQL)      │
│                     │         │                     │
│ • Job queue         │         │ • intake_submissions│
│ • Priority handling │         │ • document_cache    │
│ • Retries           │         │ • RLS enabled       │
└────────┬────────────┘         └─────────────────────┘
         │                                ▲
         │ Dequeue Job                    │ Read/Write
         ▼                                │
┌─────────────────────────────────────────┴───────────────────────┐
│                        WORKER LAYER                             │
│                  (Render/Railway Background Worker)             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   PROCESSING PIPELINE                   │   │
│  │                                                         │   │
│  │  1. Profile Summarizer (gpt-3.5-turbo, ~300 tokens)   │   │
│  │     ↓                                                   │   │
│  │  2. Document Summarizer (gpt-3.5-turbo, cached)       │   │
│  │     ↓                                                   │   │
│  │  3. Rule-Based Scorer (deterministic, no LLM)         │   │
│  │     ↓                                                   │   │
│  │  4. Plan Generator (gpt-4o-mini, ~2200 tokens)        │   │
│  │     ↓                                                   │   │
│  │  5. Notion Publisher                                   │   │
│  │     ↓                                                   │   │
│  │  6. Calendar Generator                                 │   │
│  └─────────────────┬──────────────────────────────────────┘   │
│                    │                                           │
└────────────────────┼───────────────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ OpenAI  │ │ Notion  │ │ Google  │
    │   API   │ │   API   │ │Calendar │
    └─────────┘ └─────────┘ └─────────┘
```

---

## Component Details

### 1. Frontend Layer

**Technology**: React (lovable.dev), TypeScript  
**Hosting**: lovable.dev CDN  
**Responsibilities**:
- Capture founder quiz/task data
- Submit to `/api/intake` endpoint
- Poll `/api/status/:jobId` every 3 seconds
- Display results (Notion URL, calendar links)

**Key Files**: (User-provided, not in this repo)

---

### 2. API Layer

**Technology**: Express.js, TypeScript, Node.js 18+  
**Hosting**: Vercel (serverless functions)  
**Responsibilities**:
- Accept and validate intake submissions
- Store in Supabase database
- Enqueue jobs to Redis queue
- Return job status on request

**Endpoints**:
- `POST /api/intake` - Submit quiz/tasks
- `GET /api/status/:jobId` - Poll job status
- `GET /api/health` - Health check

**Key Files**:
- `api/src/index.ts` - Express app setup
- `api/src/routes/intake.ts` - Intake route handler
- `api/src/routes/status.ts` - Status route handler
- `api/src/controllers/intakeController.ts` - Business logic
- `api/src/middleware/validation.ts` - Zod validation

**Scaling**: Automatic (Vercel serverless)

---

### 3. Redis Queue

**Technology**: Bull (job queue library), Redis (Upstash)  
**Hosting**: Upstash Redis (managed Redis)  
**Responsibilities**:
- Queue jobs for async processing
- Handle priorities (paid users first)
- Retry failed jobs (3 attempts)
- Persist job state

**Configuration**:
```typescript
const jobQueue = new Queue('sce-jobs', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
```

**Monitoring**: Bull Board (optional UI)

---

### 4. Supabase Database

**Technology**: PostgreSQL (Supabase-managed)  
**Hosting**: Supabase Cloud  
**Tables**:

#### `intake_submissions`
Stores all submissions and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | TEXT | Unique job identifier |
| status | TEXT | pending/processing/completed/failed |
| tier | TEXT | free/paid |
| founder_name | TEXT | Founder name |
| founder_email | TEXT | Founder email |
| tasks | JSONB | Array of tasks |
| strategic_plan | JSONB | Generated plan |
| notion_url | TEXT | Published Notion page URL |
| calendar_events | JSONB | Calendar events |
| llm_cost_usd | NUMERIC | Total LLM cost |
| created_at | TIMESTAMPTZ | Submission timestamp |

#### `document_cache`
Caches document summaries.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| doc_hash | TEXT | SHA-256 hash of document |
| summary | TEXT | LLM-generated summary |
| token_count | INTEGER | Tokens used |

**Indexes**: job_id, status, created_at, doc_hash  
**RLS**: Enabled (service role bypasses)

---

### 5. Worker Layer

**Technology**: Node.js, TypeScript, Bull  
**Hosting**: Render (background worker) or Railway  
**Responsibilities**:
- Dequeue jobs from Redis
- Execute processing pipeline
- Update job status in Supabase
- Handle errors and retries

**Pipeline Steps**:

#### Step 1: Profile Summarization
- **Model**: gpt-3.5-turbo
- **Input**: Founder profile fields
- **Output**: 2-3 sentence summary
- **Cost**: ~$0.0005
- **Tokens**: ~300

#### Step 2: Document Summarization
- **Model**: gpt-3.5-turbo
- **Input**: Uploaded documents (base64)
- **Output**: Summary + key insights
- **Cost**: ~$0.0027 per doc
- **Tokens**: ~1700 per doc
- **Caching**: SHA-256 hash lookup

#### Step 3: Rule-Based Scoring
- **Model**: None (deterministic code)
- **Input**: Tasks, founder profile
- **Output**: Scored tasks (0-10 scale)
- **Cost**: $0
- **Formula**:
  ```
  impactScore = 
    (0.45 * revenueLeverage) +
    (0.25 * urgency) +
    (0.15 * (1 - effort)) +
    (0.15 * skillMatch)
  ```

#### Step 4: Plan Generation
- **Model**: gpt-4o-mini
- **Input**: Scored tasks, profile, doc summaries
- **Output**: Strategic plan JSON
- **Cost**: ~$0.00087 (free), ~$0.00142 (paid)
- **Tokens**: ~2200 (free), ~3500 (paid)
- **Format**: Strict JSON

#### Step 5: Notion Publishing
- **API**: Notion API
- **Input**: Strategic plan JSON
- **Output**: Published page URL
- **Cost**: Free

#### Step 6: Calendar Generation
- **APIs**: Google Calendar API (if token), ICS generator
- **Input**: Strategic plan schedule
- **Output**: 3 calendar events
- **Cost**: Free

**Key Files**:
- `worker/src/index.ts` - Worker entry point
- `worker/src/pipeline/processor.ts` - Main orchestrator
- `worker/src/pipeline/profile-summarizer.ts` - Step 1
- `worker/src/pipeline/doc-summarizer.ts` - Step 2
- `worker/src/scoring/rule-based-scorer.ts` - Step 3
- `worker/src/pipeline/plan-generator.ts` - Step 4
- `worker/src/integrations/notion-client.ts` - Step 5
- `worker/src/integrations/calendar-generator.ts` - Step 6

---

### 6. External APIs

#### OpenAI API
- **Purpose**: LLM processing
- **Models**: gpt-3.5-turbo, gpt-4o-mini
- **Authentication**: API key (Bearer token)
- **Rate Limits**: 3,500 RPM (free tier)
- **Cost**: See COST_ANALYSIS.md

#### Notion API
- **Purpose**: Publish strategic plans
- **Authentication**: Integration token
- **Rate Limits**: 3 requests/second
- **Cost**: Free

#### Google Calendar API
- **Purpose**: Create calendar events
- **Authentication**: OAuth 2.0 access token
- **Rate Limits**: 1,000,000 queries/day
- **Cost**: Free

---

## Data Flow Diagram

### Happy Path (Free User, 1 Document)

```
1. Frontend submits quiz
   POST /api/intake
   └─> Payload: { founderName, tasks, tier: "free" }

2. API validates & stores
   └─> Supabase INSERT
   └─> Redis ENQUEUE (job_abc123)
   └─> Response: { jobId: "job_abc123" }

3. Worker dequeues job
   └─> Supabase UPDATE status = "processing"

4. Profile Summarization
   └─> OpenAI gpt-3.5-turbo
   └─> Cost: $0.0005

5. Document Summarization
   └─> Check cache (miss)
   └─> OpenAI gpt-3.5-turbo
   └─> Cache result
   └─> Cost: $0.0027

6. Rule-Based Scoring
   └─> Deterministic code
   └─> Cost: $0

7. Plan Generation
   └─> OpenAI gpt-4o-mini
   └─> Strict JSON output
   └─> Cost: $0.00087

8. Notion Publishing
   └─> Notion API
   └─> Create page with blocks
   └─> Get page URL

9. Calendar Generation
   └─> Generate 3 events
   └─> Create ICS files

10. Finalize
    └─> Supabase UPDATE status = "completed"
    └─> Store notion_url, calendar_events

11. Frontend polls status
    GET /api/status/job_abc123
    └─> Response: { status: "completed", notionUrl: "..." }

12. Frontend redirects to Notion
    └─> User sees strategic plan

Total Time: ~45 seconds
Total Cost: $0.0041
```

---

## Security Architecture

### Authentication & Authorization
- **Frontend → API**: No auth (public endpoint)*
- **API → Supabase**: Service role key (env var)
- **Worker → Supabase**: Service role key (env var)
- **Worker → OpenAI**: API key (env var)
- **Worker → Notion**: Integration token (env var)

*Future: Add user authentication via Supabase Auth

### Secrets Management
- **Development**: `.env` files (gitignored)
- **Production**: Vercel env vars, Render env vars
- **Never commit**: API keys, tokens, passwords

### Row Level Security (RLS)
- Enabled on `intake_submissions` and `document_cache`
- Service role bypasses RLS
- Future: Founders can only read their own submissions

### Input Validation
- Zod schemas validate all inputs
- Email validation
- Task array validation
- File size limits (5MB)

### Rate Limiting
- 100 requests per IP per 15 minutes
- Configurable via env vars

### CORS
- Only frontend domain allowed
- Configured via `FRONTEND_URL` env var

---

## Monitoring & Observability

### Logs
- **API**: Vercel logs (JSON format)
- **Worker**: Render/Railway logs
- **Database**: Supabase logs

### Metrics
- Request duration
- LLM token usage
- LLM cost per job
- Job processing duration
- Queue length
- Cache hit rate

### Alerts
- Job failures (email/Slack)
- Daily cost exceeds $100
- Budget exceeded events
- Worker crashes

### Health Checks
- `GET /api/health` (API)
- Worker heartbeat (Bull)
- Database connection checks

---

## Scaling Strategy

### Current Limits
- **API**: Unlimited (Vercel serverless)
- **Worker**: 1 instance (Render starter)
- **Database**: 500MB (Supabase free)
- **Redis**: 10k commands/day (Upstash free)

### Bottlenecks
1. **Worker throughput**: 1 job at a time
2. **OpenAI rate limits**: 3,500 RPM
3. **Redis queue**: Command limit

### Scaling Actions

#### 1-100 users/day
- Current setup sufficient
- Free tiers cover costs

#### 100-1000 users/day
- Scale worker to 3 instances (Render: $21/mo)
- Upgrade Redis (Upstash: $10/mo)
- Upgrade Supabase (Pro: $25/mo)

#### 1000+ users/day
- Scale worker to 10+ instances
- Migrate to Redis Cloud (dedicated)
- Upgrade Supabase (Team: $599/mo)
- Request OpenAI rate limit increase
- Add load balancer for API
- Implement job prioritization

---

## Disaster Recovery

### Backups
- **Database**: Supabase automatic daily backups
- **Code**: GitHub repository
- **Secrets**: Store in password manager (1Password, LastPass)

### Recovery Procedures

#### API goes down
1. Check Vercel status dashboard
2. Redeploy via `vercel --prod`
3. Verify health endpoint

#### Worker crashes
1. Check Render/Railway logs
2. Restart worker service
3. Verify Redis connection
4. Re-enqueue failed jobs

#### Database corruption
1. Restore from Supabase backup
2. Re-run migrations if needed
3. Verify data integrity

#### Redis queue lost
1. Jobs in progress will fail
2. Frontend shows error
3. Users can resubmit

---

## Cost Breakdown (Monthly)

### 1,000 users (90% free, 10% paid)

| Component | Service | Cost |
|-----------|---------|------|
| API | Vercel | $0 |
| Worker | Render | $7 |
| Database | Supabase | $0 |
| Queue | Upstash Redis | $0 |
| LLM (900 free) | OpenAI | $3.70 |
| LLM (100 paid) | OpenAI | $1.20 |
| Notion | Notion | $0 |
| **Total** | | **$11.90** |

**Per-user cost**: $0.01

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API response time | <200ms | ~100ms |
| Job processing time | <90s | ~45s |
| Cache hit rate | >40% | TBD |
| Job success rate | >99% | TBD |
| LLM cost per job | <$0.05 | $0.004 |

---

## Technology Decisions

### Why Vercel for API?
- Serverless = automatic scaling
- Free tier generous
- Fast cold starts
- Easy deployment

### Why Render for Worker?
- Always-on background workers
- Simple deployment
- Affordable ($7/mo)
- Good logging

### Why Supabase?
- PostgreSQL (familiar)
- Generous free tier
- Built-in auth (future)
- Real-time (future)

### Why Bull + Redis?
- Battle-tested
- Built-in retries
- Priority queues
- Simple to use

### Why TypeScript?
- Type safety
- Better IDE support
- Fewer runtime errors
- Excellent ecosystem

---

**Last Updated**: October 13, 2024  
**Version**: 1.0.0

