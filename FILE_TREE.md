# Quicklarity - Complete File Tree

```
quicklarity/
│
├── README.md                           # Main documentation with deployment instructions
├── DEPLOYMENT.md                       # Detailed step-by-step deployment guide
├── FILE_TREE.md                        # This file - complete project structure
├── .gitignore                          # Git ignore patterns
│
├── api/                                # Backend REST API (deployed to Vercel)
│   ├── package.json                    # Dependencies and scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── vercel.json                     # Vercel deployment config
│   ├── jest.config.js                  # Jest test configuration
│   ├── .eslintrc.json                  # ESLint rules
│   │
│   ├── src/
│   │   ├── index.ts                    # Express app setup and server entry
│   │   │
│   │   ├── routes/
│   │   │   ├── intake.ts               # POST /api/intake endpoint
│   │   │   └── status.ts               # GET /api/status/:jobId endpoint
│   │   │
│   │   ├── controllers/
│   │   │   ├── intakeController.ts     # Intake request handler
│   │   │   └── statusController.ts     # Status request handler
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts         # Global error handling
│   │   │   ├── requestLogger.ts        # Request logging middleware
│   │   │   └── validation.ts           # Zod schema validation
│   │   │
│   │   └── utils/
│   │       ├── supabase.ts             # Supabase client and helpers
│   │       └── queue.ts                # Bull queue for job enqueueing
│   │
│   └── tests/
│       ├── intake.test.ts              # Intake endpoint tests
│       └── status.test.ts              # Status endpoint tests
│
├── worker/                             # Background job processor (deployed to Render/Railway)
│   ├── package.json                    # Dependencies and scripts
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── jest.config.js                  # Jest test configuration
│   │
│   ├── src/
│   │   ├── index.ts                    # Worker process entry point
│   │   │
│   │   ├── pipeline/
│   │   │   ├── processor.ts            # Main job processing orchestrator
│   │   │   ├── profile-summarizer.ts   # Founder profile summarization (gpt-3.5-turbo)
│   │   │   ├── doc-summarizer.ts       # Document summarization with caching
│   │   │   └── plan-generator.ts       # Strategic plan generation (gpt-4o-mini)
│   │   │
│   │   ├── scoring/
│   │   │   └── rule-based-scorer.ts    # Deterministic task scoring (no LLM)
│   │   │
│   │   ├── integrations/
│   │   │   ├── notion-client.ts        # Notion API publishing
│   │   │   └── calendar-generator.ts   # Google Calendar + ICS generation
│   │   │
│   │   └── utils/
│   │       ├── llm-client.ts           # OpenAI API client with cost tracking
│   │       ├── prompt-loader.ts        # Load and parse prompt templates
│   │       ├── cost-tracker.ts         # Budget enforcement logic
│   │       ├── supabase.ts             # Supabase client
│   │       └── doc-cache.ts            # Document cache utilities
│   │
│   └── tests/
│       ├── rule-based-scorer.test.ts   # Scoring logic tests
│       └── plan-generator.test.ts      # Plan generation tests
│
├── prompts/                            # LLM prompt templates
│   ├── profile-summarize.txt           # Founder profile summarization prompt
│   ├── doc-summarize.txt               # Document summarization prompt
│   ├── plan-generation.txt             # Strategic plan generation prompt (main)
│   └── few-shot-examples.json          # 2 complete few-shot examples
│
├── shared/                             # Shared types and utilities
│   └── types/
│       └── index.ts                    # TypeScript interfaces and types
│
├── supabase/                           # Database schema and migrations
│   └── migrations/
│       └── 001_initial_schema.sql      # Initial database schema with tables, indexes, RLS
│
└── ci/                                 # CI/CD workflows
    └── workflows/
        ├── test.yml                    # Automated testing workflow
        └── deploy.yml                  # Deployment workflow
```

## File Count Summary

- **Total Files**: 45
- **Source Files**: 30
- **Test Files**: 4
- **Configuration Files**: 11

## Key Architecture Components

### 1. API Layer (`api/`)
- **Purpose**: Accept intake submissions, return status
- **Tech**: Express.js, TypeScript, Supabase, Bull Queue
- **Deploy**: Vercel (serverless functions)
- **Endpoints**:
  - `POST /api/intake` - Submit quiz/tasks
  - `GET /api/status/:jobId` - Poll job status
  - `GET /api/health` - Health check

### 2. Worker Layer (`worker/`)
- **Purpose**: Process jobs asynchronously
- **Tech**: Bull, OpenAI, Notion API, TypeScript
- **Deploy**: Render/Railway (background worker)
- **Pipeline**:
  1. Profile summarization (cheap model)
  2. Document summarization (cheap model, cached)
  3. Rule-based scoring (no LLM)
  4. Strategic plan generation (quality model, single call)
  5. Notion publishing
  6. Calendar event generation

### 3. Database (`supabase/`)
- **Tables**:
  - `intake_submissions` - All submissions and results
  - `document_cache` - Cached document summaries
- **Features**: Row Level Security, triggers, indexes, views

### 4. Prompts (`prompts/`)
- **3 prompt templates** with system/user sections
- **2 few-shot examples** with complete input/output
- **Variable substitution** using `{{variable}}` syntax

### 5. Testing (`*/tests/`)
- **Unit tests** for critical paths
- **Jest** as test runner
- **Coverage** enforced at 70%+

### 6. CI/CD (`ci/workflows/`)
- **Automated testing** on every push/PR
- **Deployment** to Vercel and Render on main branch
- **Database migrations** via Supabase CLI
- **Security scanning** with npm audit and TruffleHog

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | Express.js + TypeScript | REST endpoints |
| Worker | Node.js + Bull | Async job processing |
| Database | Supabase (PostgreSQL) | Data persistence |
| Queue | Bull + Redis | Job queue |
| LLM | OpenAI (gpt-3.5-turbo, gpt-4o-mini) | AI processing |
| Publishing | Notion API | Strategic plan delivery |
| Calendar | Google Calendar API + ical-generator | Event generation |
| Validation | Zod | Request validation |
| Testing | Jest + Supertest | Unit/integration tests |
| CI/CD | GitHub Actions | Automation |
| Deploy | Vercel + Render | Hosting |

## Cost Budget Implementation

### Free Tier ($0.05 max)
- Profile summary: ~300 tokens → $0.0009
- Doc summary (1 doc): ~500 tokens → $0.0015
- Plan generation: ~2500 tokens → $0.0375
- **Total**: ~$0.04 ✅

### Paid Tier ($1.00 max)
- Profile summary: ~300 tokens → $0.0009
- Doc summaries (5 docs): ~2500 tokens → $0.0075
- Plan generation: ~4000 tokens → $0.06
- **Total**: ~$0.07 ✅

### Cost Optimization Features
1. **Document caching** (SHA-256 hash)
2. **Rule-based scoring** (deterministic, no LLM)
3. **Cheap models** for preprocessing (gpt-3.5-turbo)
4. **Single quality call** for final plan (gpt-4o-mini)
5. **Strict token limits** per call
6. **Budget guards** with automatic cutoff

## Security Features

- Row Level Security (RLS) on Supabase
- API key environment variables
- Rate limiting middleware
- Input validation with Zod
- CORS restrictions
- Service role key isolation
- Secrets scanning in CI

## Observability

- Request logging middleware
- Error tracking with context
- Token/cost logging per LLM call
- Job queue statistics
- Database views for analytics
- Health check endpoint

## Next Steps for Enhancement

1. **Email notifications** (SendGrid/Postmark)
2. **Webhook callbacks** instead of polling
3. **Real-time updates** via WebSocket
4. **User authentication** (Supabase Auth)
5. **Admin dashboard** (view all submissions)
6. **A/B testing** for prompts
7. **Advanced analytics** (Mixpanel/Amplitude)
8. **Multi-tenant** support
9. **PDF export** of strategic plans
10. **Slack integration** for notifications

---

This is a production-ready MVP with all essential features implemented.

