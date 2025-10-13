# Quicklarity - Developer Input

**INSTRUCTIONS**: Fill in all values below before deploying. Cursor will pause if required secrets are missing.

---

## Required API Keys & Secrets

### Clerk (Authentication)
```bash
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend
```
Get from: https://dashboard.clerk.com → Your App → API Keys

### Supabase (Database)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role (backend only!)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co  # Frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Frontend
```
Get from: https://app.supabase.com → Your Project → Settings → API

### OpenAI (LLM)
```bash
OPENAI_API_KEY=sk-...
```
Get from: https://platform.openai.com/api-keys

**Model Configuration**:
```bash
FREE_MODEL=gpt-4o-mini          # For free users (crucial final plan step)
PAID_MODEL=gpt-4o               # For paid users (highest quality)
SUMMARIZATION_MODEL=gpt-4o-nano # For doc summarization (cheapest)
```

### Stripe (Billing)
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Frontend
```
Get from: https://dashboard.stripe.com/apikeys

**Price IDs** (create products/prices in Stripe first):
```bash
STRIPE_PRICE_ID_FREE=price_...      # Free tier (optional, for tracking)
STRIPE_PRICE_ID_PAID=price_...      # Paid plan (e.g., $29/month)
```

### PostHog (Analytics)
```bash
POSTHOG_API_KEY=phc_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...     # Frontend
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # Or self-hosted
```
Get from: https://app.posthog.com → Project Settings → API Keys

### Notion (Deliverable Publishing)
```bash
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...              # Database where plans are published
```
Get from: https://www.notion.so/my-integrations

### Google Calendar (Optional)
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```
Get from: https://console.cloud.google.com → APIs & Services → Credentials

### Redis (Optional - Job Queue)
```bash
REDIS_URL=redis://localhost:6379   # Optional; if missing, uses Supabase jobs table
```
Get from: Upstash (https://upstash.com) or local Redis

---

## Application Configuration

### API & Frontend URLs
```bash
API_URL=http://localhost:8000               # Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:8000   # Frontend (production: https://your-api.vercel.app)
FRONTEND_URL=http://localhost:3000          # Frontend base URL
```

### Cost & Token Limits
```bash
FREE_USER_MAX_COST_USD=0.05        # Max LLM cost per free user
PAID_USER_MAX_COST_USD=1.00        # Max LLM cost per paid user

# Token limits per call (calculated in manifest.json)
FREE_USER_MAX_TOKENS_FINAL=600     # Max tokens for final plan (free)
PAID_USER_MAX_TOKENS_FINAL=1200    # Max tokens for final plan (paid)
```

### Environment
```bash
NODE_ENV=development    # development | production
PORT=8000              # Backend API port
```

---

## Model Pricing (Reference - DO NOT EDIT)

```bash
# OpenAI GPT-4o Family Pricing (as of Oct 2024)
# gpt-4o-nano: $0.00015/1K prompt, $0.0006/1K completion (cheapest)
# gpt-4o-mini: $0.00015/1K prompt, $0.0006/1K completion (balanced)
# gpt-4o: $0.005/1K prompt, $0.015/1K completion (highest quality)
```

---

## Deployment Commands (After filling above)

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install
```

### 2. Apply Database Migrations
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Run Tests
```bash
npm test
```

### 4. Start Development Servers
```bash
# Backend (Terminal 1)
npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### 5. Create Stripe Products (First Time Only)
```bash
# Create product
stripe products create --name "Strategic Clarity Pro" --description "Full access to Strategic Clarity Engine"

# Create price (monthly subscription)
stripe prices create \
  --product prod_XXX \
  --unit-amount 2900 \
  --currency usd \
  --recurring interval=month

# Copy price_XXX ID to STRIPE_PRICE_ID_PAID above
```

### 6. Set up Stripe Webhook
```bash
# Get webhook signing secret
stripe listen --forward-to localhost:8000/webhook/stripe

# Or create webhook endpoint at:
# https://dashboard.stripe.com/webhooks
# URL: https://your-api.vercel.app/webhook/stripe
# Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
```

---

## Verification Checklist

- [ ] All API keys filled in above
- [ ] Supabase project created
- [ ] Database migrations applied (`supabase db push`)
- [ ] Stripe products & prices created
- [ ] Stripe webhook configured
- [ ] Notion integration created and database shared
- [ ] Tests passing (`npm test`)
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Frontend starts without errors (`cd frontend && npm run dev`)
- [ ] Can create Clerk account and log in
- [ ] Can submit test intake and see job created
- [ ] Worker processes job and publishes to Notion
- [ ] Stripe checkout creates subscription
- [ ] Webhook updates subscription_status in Supabase

---

## Optional Configuration

### Phone Verification (Clerk)
Enable phone verification in Clerk dashboard:
https://dashboard.clerk.com → User & Authentication → Phone

### Email Templates (Clerk)
Customize at: https://dashboard.clerk.com → Email & SMS

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
```

---

**Status**: ⚠️ NOT CONFIGURED (fill in secrets above before proceeding)

**Next Step**: Fill all required values, then run `npm install && npm test`

