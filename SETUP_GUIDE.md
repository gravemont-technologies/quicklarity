# 🚀 Quick Setup Guide - Strategic Clarity Engine

## Step 1: Create Your Environment Files (5 minutes)

### Backend & Worker Environment
```bash
# Copy the example file
cp .env.example .env

# Open and fill in your keys
code .env  # or nano .env
```

### Frontend Environment
```bash
# Copy the frontend example file
cp frontend/.env.example frontend/.env

# Open and fill in your keys
code frontend/.env  # or nano frontend/.env
```

## Step 2: Get Your API Keys (15-20 minutes)

### 🔐 Clerk (Authentication)
1. Go to https://dashboard.clerk.com
2. Create new application → Choose "React"
3. Copy **Publishable Key** → Paste in both `.env` and `frontend/.env`
4. Copy **Secret Key** → Paste in `.env` only

### 🗄️ Supabase (Database)
1. Go to https://app.supabase.com
2. Create new project
3. Go to Settings → API
4. Copy:
   - **URL** → Both `.env` files
   - **anon public** key → Both `.env` files  
   - **service_role** key → `.env` only (NEVER in frontend!)

### 🤖 OpenAI (AI/LLM)
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy → Paste in `.env`
4. Add $5 credits to your account

### 💳 Stripe (Payments)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy:
   - **Publishable key** → `frontend/.env`
   - **Secret key** → `.env`
3. Set up webhook (see below)

### 📊 PostHog (Analytics)
1. Go to https://app.posthog.com
2. Go to Project Settings
3. Copy **Project API Key** → Both `.env` files

### 📝 Notion (Publishing)
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy **Internal Integration Token** → `.env`
4. Create a database in Notion
5. Share database with your integration
6. Copy database ID from URL → `.env`

## Step 3: Setup Stripe Webhook (5 minutes)

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:8000/webhook/stripe

# Copy the webhook signing secret (whsec_...) to .env
```

## Step 4: Setup Database (5 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Step 5: Install Dependencies (3 minutes)

```bash
# Backend/Worker
npm install

# Frontend
cd frontend && npm install && cd ..
```

## Step 6: Create Missing Worker Files (10 minutes)

Create these 6 files and copy code from implementation guide:

```bash
mkdir -p worker/src/steps
mkdir -p worker/src/utils

# Create files (copy code from IMPLEMENTATION_COMPLETE.md):
touch worker/src/steps/profileNormalizer.js
touch worker/src/steps/docSummarizer.js
touch worker/src/steps/planGenerator.js
touch worker/src/notionPublisher.js
touch worker/src/calendarGenerator.js
touch worker/src/utils/openaiClient.js
```

## Step 7: Test Locally (5 minutes)

Open 3 terminal windows:

```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Worker
npm run worker:dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

Visit: http://localhost:3000

## Step 8: Verify Everything Works

```bash
# Check API health
curl http://localhost:8000/health

# Submit test intake
curl -X POST http://localhost:8000/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "tasks": [{"id":"1","title":"Test task","description":"Testing"}],
    "guest": true
  }'

# You should get back: {"jobId":"...","eta_seconds":...}
```

## ✅ Checklist

Before proceeding:
- [ ] `.env` file created with all backend keys
- [ ] `frontend/.env` file created with all frontend keys
- [ ] Supabase database migrations applied
- [ ] All `npm install` completed without errors
- [ ] 6 worker files created with code
- [ ] All 3 services running (API, Worker, Frontend)
- [ ] Health check returns 200 OK
- [ ] Test intake submission works

## 🆘 Common Issues

**"Missing environment variable"**
→ Check spelling in `.env` matches exactly

**"Supabase connection failed"**
→ Verify URL and keys are correct, no extra spaces

**"OpenAI API error"**
→ Ensure you have credits ($5 minimum)

**"Worker not processing jobs"**
→ Check worker terminal for errors, ensure Redis or Supabase polling is working

## 🎉 You're Ready!

Once all checkboxes are ✅, you're ready to:
1. Run full smoke tests (see SMOKE_TEST.md)
2. Deploy to production (see DEPLOYMENT.md)
3. Start acquiring users!

---

**Total Setup Time**: ~45-60 minutes
**Next**: See SMOKE_TEST.md for 30-point verification checklist

