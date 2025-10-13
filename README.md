# Strategic Clarity Engine - Complete MVP

Production-ready SaaS MVP with Clerk authentication, Supabase database, Stripe billing, PostHog analytics, Notion publishing, and Google Calendar integration.

## ✅ What's Included

- **Backend API** (Express/Node.js) with Clerk authentication
- **Worker Service** with 6-step LLM pipeline and rule-based scoring
- **Frontend** (React/Vite) with Clerk login and guest mode
- **Database** (Supabase PostgreSQL) with full schema
- **Billing** (Stripe) with webhook handling
- **Analytics** (PostHog) server + client tracking
- **Publishing** (Notion API) for strategic plans
- **Calendar** (Google Calendar + ICS fallback)
- **Job Queue** (BullMQ/Redis with Supabase fallback)
- **Tests** (Jest) with CI/CD (GitHub Actions)

## 🚀 Quick Start

### 1. Prerequisites
```bash
node -v  # Must be 18+
npm -v
```

### 2. Fill DEV_INPUT.md
**IMPORTANT**: Open `DEV_INPUT.md` and fill in all API keys and secrets before proceeding.

### 3. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 4. Apply Database Migrations
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 5. Run Tests
```bash
npm test
```

### 6. Start Development Servers
```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Worker
npm run worker:dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 7. Verify
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health

## 📋 Environment Variables

See `DEV_INPUT.md` for complete list. Required:

**Backend** (`.env`):
```
CLERK_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
POSTHOG_API_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
FREE_MODEL=gpt-3.5-turbo
PAID_MODEL=gpt-4o-mini
```

**Frontend** (`frontend/.env`):
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## 🏗️ Architecture

```
Frontend (React/Vite)
  ↓ POST /intake
Backend API (Express)
  ↓ Enqueue job
Redis Queue (or Supabase)
  ↓ Dequeue
Worker (LLM Pipeline)
  → Notion API
  → Google Calendar
  ↓ Update
Supabase Database
```

## 📊 LLM Pipeline (6 Steps)

1. **Profile Normalization** (gpt-3.5-turbo, ~400 tokens, $0.0007)
2. **Doc Summarization** (gpt-3.5-turbo, ~1200 tokens/doc, $0.002, cached)
3. **Rule-Based Scoring** (deterministic code, $0)
4. **Final Plan Generation** (gpt-4o-mini, ~2000 tokens, $0.0008)
5. **Notion Publishing** (API, free)
6. **Calendar Generation** (API + ICS, free)

**Cost per user**: Free $0.005, Paid $0.008 (well under caps of $0.05/$1.00)

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

Tests included:
- `/intake` validation
- `/status` responses
- Worker JSON parsing (robust + rectifier)

## 🚢 Deployment

### Backend to Vercel
```bash
vercel --prod
# Set all env vars in Vercel dashboard
```

### Frontend to Vercel
```bash
cd frontend
vercel --prod
```

### Worker to Render
1. Create Background Worker service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `npm run worker`
5. Add all env vars

### Database (Supabase)
```bash
supabase db push
```

## 📱 Frontend Components

- `QuizForm.jsx` - Intake form with Clerk auth
- `StatusPage.jsx` - Job status polling + results
- `RatingWidget.jsx` - 1-5 star feedback
- `api.js` - API client utilities

## 💳 Stripe Setup

```bash
# Create product
stripe products create --name "Strategic Clarity Pro"

# Create price
stripe prices create \
  --product prod_XXX \
  --unit-amount 2900 \
  --currency usd \
  --recurring interval=month

# Set STRIPE_PRICE_ID_PAID in .env

# Configure webhook
stripe listen --forward-to localhost:8000/webhook/stripe
```

## 📈 PostHog Events

Tracked events:
- `intake_submitted` - User submits quiz
- `job_enqueued` - Job added to queue
- `job_started` - Worker begins processing
- `job_completed` - Plan published (with cost_estimate_usd)
- `subscription_activated` - User upgrades
- `rating_submitted` - User leaves feedback

## 🗃️ Database Schema

Tables:
- `founders` - User accounts (Clerk ID, subscription, permissions)
- `jobs` - Strategic planning jobs
- `doc_summaries` - Cached document summaries (SHA256-keyed)
- `invitations` - Referral codes
- `ratings` - User feedback (1-5 stars)

## 🔒 Security & Privacy

- ✅ Clerk authentication
- ✅ Supabase Row Level Security (RLS)
- ✅ Stripe webhook signature verification
- ✅ Rate limiting (100 req/15min)
- ✅ CORS restrictions
- ✅ `/deleteAccount` endpoint (GDPR compliance)

## 📋 Smoke Test Checklist

- [ ] 1. Fill `DEV_INPUT.md` with all secrets
- [ ] 2. Run `supabase db push`
- [ ] 3. Run `npm install && npm test` (all pass)
- [ ] 4. Start backend (`npm run dev`) - no errors
- [ ] 5. Start worker (`npm run worker:dev`) - connects to queue
- [ ] 6. Start frontend (`cd frontend && npm run dev`)
- [ ] 7. Create Clerk account and log in
- [ ] 8. Submit test intake
- [ ] 9. Verify job status changes to "running" then "done"
- [ ] 10. Check Notion page created
- [ ] 11. Download ICS file or see calendar event
- [ ] 12. Create Stripe checkout session
- [ ] 13. Complete payment (test mode)
- [ ] 14. Verify webhook updates `subscription_status` in Supabase
- [ ] 15. Submit 1-5 star rating on status page

## 🛠️ Troubleshooting

**Worker not processing jobs?**
- Check Redis connection or Supabase jobs table
- Verify OPENAI_API_KEY is set
- Check worker logs for errors

**Stripe webhook not working?**
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook endpoint URL in Stripe dashboard
- Use `stripe listen` for local testing

**Notion publish fails?**
- Verify NOTION_API_KEY and NOTION_DATABASE_ID
- Ensure integration has access to database
- Check Notion API rate limits

## 📚 Documentation

- `DEV_INPUT.md` - Configuration template
- `manifest.json` - Cost analysis & budgets
- `README.md` - This file
- `prompts/` - All LLM prompt templates

## 💰 Pricing & Costs

**Infrastructure** (1,000 users/month):
- Vercel (frontend + backend): $0 (free tier)
- Supabase: $0 (free tier, up to 500MB)
- Redis (Upstash): $0 (free tier)
- Render (worker): $7/month
- **OpenAI LLM**: ~$5/month (avg $0.005/user)
- **Total**: ~$12/month

**Per-user cost**: $0.012
**Gross margin**: 99%+ at $29/mo pricing

## 🎯 Cost Budget Compliance

✅ **Free user**: $0.005 avg (cap: $0.05) - 10% utilization
✅ **Paid user**: $0.008 avg (cap: $1.00) - 0.8% utilization

Mitigations applied:
- Free users limited to 1 doc chunk
- Rule-based scoring eliminates LLM scoring call
- Single final LLM call (no iterations)
- Document caching via SHA256 hash

## 📦 Project Structure

```
quicklarity/
├── server.js                   # Main API server
├── package.json                # Dependencies
├── DEV_INPUT.md                # Configuration template
├── manifest.json               # Cost analysis
│
├── routes/                     # API endpoints
│   ├── intake.js              # POST /intake
│   ├── status.js              # GET /status/:jobId
│   ├── stripe.js              # Stripe webhook
│   └── account.js             # /checkout, /deleteAccount, /rating
│
├── middleware/
│   └── auth.js                # Clerk authentication
│
├── lib/                       # Shared utilities
│   ├── supabaseClient.js
│   ├── queueClient.js         # BullMQ/Redis
│   ├── posthogClient.js
│   └── openaiClient.js
│
├── worker/                    # Job processor
│   ├── index.js               # Worker entry point
│   ├── pipeline.js            # 6-step LLM pipeline
│   ├── scorer.js              # Rule-based scoring
│   ├── notionPublisher.js
│   └── calendarGenerator.js
│
├── prompts/                   # LLM prompts
│   ├── profile_normalize.md
│   ├── summarizer.md
│   ├── final_plan.md
│   ├── rectifier.md
│   └── template_notation.md
│
├── tests/                     # Jest tests
│   ├── intake.test.js
│   ├── status.test.js
│   └── worker.test.js
│
├── supabase/
│   └── migrations/
│       └── 001_init.sql       # Database schema
│
├── frontend/                  # React/Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
└── .github/
    └── workflows/
        └── ci.yml             # GitHub Actions CI
```

## 🚀 Next Steps

1. Fill `DEV_INPUT.md` with your API keys
2. Run smoke test checklist
3. Deploy to production
4. Monitor costs and usage
5. Iterate based on user feedback

---

**Built with** Node.js, React, Supabase, Clerk, Stripe, PostHog, Notion, OpenAI

**License**: MIT

**Version**: 1.0.0
