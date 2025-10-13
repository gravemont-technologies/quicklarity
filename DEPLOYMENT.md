# Quicklarity - Deployment Guide

This guide walks you through deploying SCE from scratch to production.

## Prerequisites

- Node.js 18+ installed locally
- Git repository set up
- Accounts created:
  - [Supabase](https://supabase.com) (free tier works)
  - [Vercel](https://vercel.com) (free tier works)
  - [Render](https://render.com) or [Railway](https://railway.app) (for worker)
  - [OpenAI](https://platform.openai.com) (API key with credits)
  - [Notion](https://notion.so) (free account)
  - [Upstash Redis](https://upstash.com) (free tier) or local Redis

## Step-by-Step Deployment

### 1. Clone and Install

```bash
git clone <your-repo>
cd quicklarity

# Install API dependencies
cd api && npm install && cd ..

# Install Worker dependencies
cd worker && npm install && cd ..
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

3. Go to **SQL Editor** and run the migration:

```bash
# Option A: Using Supabase CLI
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Option B: Manual - paste contents of supabase/migrations/001_initial_schema.sql into SQL Editor
```

4. Verify tables were created:
   - `intake_submissions`
   - `document_cache`

### 3. Set Up Redis Queue

**Option A: Upstash Redis (Recommended for production)**

1. Create free Redis database at https://upstash.com
2. Copy the Redis URL (starts with `redis://`)

**Option B: Local Redis (Development only)**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis

# Redis URL: redis://localhost:6379
```

### 4. Set Up OpenAI

1. Create account at https://platform.openai.com
2. Add billing and credits ($5 minimum recommended)
3. Create API key: https://platform.openai.com/api-keys
4. Copy the key (starts with `sk-`)

### 5. Set Up Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**
3. Name it "Strategic Clarity Engine"
4. Copy the **Internal Integration Token** (starts with `secret_`)
5. Create a new database in Notion for storing plans:
   - Create a new page
   - Add a database (table view)
   - Add properties: Name (title), Status (select), Created (date)
6. Share the database with your integration:
   - Click **Share** on the database page
   - Invite your integration
7. Copy the database ID from the URL:
   - URL format: `notion.so/workspace/DATABASE_ID?v=...`
   - Copy the `DATABASE_ID` part

### 6. Configure Environment Variables

**API Environment Variables** (`api/.env`)

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
REDIS_URL=redis://your-redis-url
FRONTEND_URL=https://your-lovable-app.lovable.app
NODE_ENV=production
PORT=3000
```

**Worker Environment Variables** (`worker/.env`)

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-key
NOTION_API_KEY=secret_your-notion-token
NOTION_DATABASE_ID=your-database-id
REDIS_URL=redis://your-redis-url
FREE_TIER_MAX_USD=0.05
PAID_TIER_MAX_USD=1.00
SUMMARIZATION_MODEL=gpt-3.5-turbo
PLAN_MODEL=gpt-4o-mini
SUMMARIZATION_TEMPERATURE=0.1
PLAN_TEMPERATURE=0.2
```

### 7. Test Locally

```bash
# Terminal 1: Start Redis (if local)
redis-server

# Terminal 2: Start API
cd api
npm run dev

# Terminal 3: Start Worker
cd worker
npm run dev

# Terminal 4: Test the API
curl -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "founderName": "Test User",
    "founderEmail": "test@example.com",
    "tasks": [{"id":"1","title":"Test task"}],
    "tier": "free"
  }'

# Should return: {"success":true,"jobId":"job_...","message":"...","estimatedCompletionTime":...}

# Check status
curl http://localhost:3000/api/status/JOB_ID_FROM_ABOVE
```

### 8. Deploy API to Vercel

```bash
cd api

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables (do this for each variable)
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add REDIS_URL
vercel env add FRONTEND_URL

# Redeploy to pick up env vars
vercel --prod
```

Your API is now live at: `https://your-project.vercel.app`

### 9. Deploy Worker to Render

1. Go to https://dashboard.render.com
2. Click **New** → **Background Worker**
3. Connect your GitHub repository
4. Configure:
   - **Name**: sce-worker
   - **Environment**: Node
   - **Build Command**: `cd worker && npm install`
   - **Start Command**: `cd worker && npm start`
   - **Branch**: main
5. Add environment variables (click **Environment** tab):
   - Add all variables from `worker/.env` template
6. Click **Create Background Worker**
7. Wait for deployment to complete

Alternative: Deploy to Railway

```bash
cd worker
railway login
railway init
railway up

# Add environment variables in Railway dashboard
```

### 10. Set Up CI/CD (Optional)

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
   - `VERCEL_TOKEN`
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`
   - `REDIS_URL`
   - `FRONTEND_URL`
   - `API_URL`

3. Workflows will run automatically on push to `main`

### 11. Verify Deployment

```bash
# Test production API
curl https://your-api.vercel.app/api/health

# Should return: {"status":"healthy","timestamp":"...","uptime":...}

# Test intake endpoint
curl -X POST https://your-api.vercel.app/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "founderName": "Production Test",
    "founderEmail": "prod@example.com",
    "tasks": [{"id":"1","title":"Test task"}],
    "tier": "free"
  }'

# Check worker logs in Render/Railway dashboard
```

### 12. Connect to Frontend

Update your lovable.dev frontend to use the production API:

```javascript
const API_URL = 'https://your-api.vercel.app';

// On form submit
const response = await fetch(`${API_URL}/api/intake`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});

const { jobId } = await response.json();

// Poll for status
const pollStatus = async () => {
  const statusRes = await fetch(`${API_URL}/api/status/${jobId}`);
  const status = await statusRes.json();
  
  if (status.status === 'completed') {
    // Show Notion URL and calendar links
    window.location.href = status.notionUrl;
  } else if (status.status === 'failed') {
    // Show error
    alert(status.errorMessage);
  } else {
    // Still processing, poll again
    setTimeout(pollStatus, 3000);
  }
};
```

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection:
   ```bash
   redis-cli -u YOUR_REDIS_URL ping
   ```
2. Check worker logs in Render/Railway
3. Verify environment variables are set
4. Test job queue manually:
   ```javascript
   const Queue = require('bull');
   const queue = new Queue('sce-jobs', 'YOUR_REDIS_URL');
   queue.getJobCounts().then(console.log);
   ```

### LLM costs exceeding budget

1. Check `llm_cost_usd` in Supabase `intake_submissions` table
2. Review token counts in logs
3. Reduce `max_tokens` in prompt configurations
4. Verify document caching is working

### Notion publishing fails

1. Verify integration has access to database
2. Check database ID is correct
3. Test Notion API manually:
   ```bash
   curl https://api.notion.com/v1/databases/YOUR_DB_ID \
     -H "Authorization: Bearer YOUR_NOTION_KEY" \
     -H "Notion-Version: 2022-06-28"
   ```

### Supabase RLS blocking operations

If using Row Level Security, ensure service role key bypasses RLS:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'intake_submissions';

-- Service role should have bypass
GRANT ALL ON intake_submissions TO service_role;
```

## Monitoring

- **API**: Vercel Dashboard → Your Project → Analytics
- **Worker**: Render Dashboard → Your Service → Logs
- **Database**: Supabase Dashboard → Your Project → Database
- **Queue**: Use Bull Board for Redis queue monitoring:
  ```bash
  npm install bull-board
  # Add to API for monitoring UI
  ```

## Cost Estimates

- **Supabase**: Free (up to 500MB database, 2GB bandwidth)
- **Vercel**: Free (hobby tier, 100GB bandwidth)
- **Render**: $7/mo (background worker)
- **Redis (Upstash)**: Free (10k commands/day)
- **OpenAI**: ~$0.03 per free user, ~$0.60 per paid user
- **Notion**: Free

**Total**: ~$7/mo + OpenAI costs

## Security Checklist

- [ ] Rotate all API keys after deployment
- [ ] Enable Supabase RLS for production
- [ ] Add rate limiting to API endpoints
- [ ] Set up monitoring alerts
- [ ] Configure CORS to only allow your frontend domain
- [ ] Never commit `.env` files to git
- [ ] Use Vercel/Render secret management
- [ ] Set up database backups in Supabase

## Scaling

When you outgrow free tiers:

1. **Supabase**: Upgrade to Pro ($25/mo) for higher limits
2. **Redis**: Upgrade Upstash or migrate to Redis Cloud
3. **Worker**: Scale to multiple instances on Render
4. **API**: Vercel automatically scales serverless functions
5. **LLM**: Request higher rate limits from OpenAI

---

Need help? Check logs and monitoring dashboards first. Most issues are environment variable misconfigurations.

