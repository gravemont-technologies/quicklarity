# ⚡ Quick Start - Zero Debugging Required

## 🎯 One-Line Setup (After filling .env)

### Windows (PowerShell):
```powershell
.\START.ps1
```

### Mac/Linux:
```bash
chmod +x START.sh && ./START.sh
```

That's it! This will:
1. ✅ Run preflight checks
2. ✅ Start Backend API (port 8000)
3. ✅ Start Worker (background)
4. ✅ Start Frontend (port 3000)
5. ✅ Open in browser automatically

---

## 📋 Before Running (5 Minutes)

### Step 1: Fill Environment Files
```bash
# Edit root .env
code .env

# Fill these (MINIMUM required):
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...

# Edit frontend .env
code frontend/.env

# Fill these:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

### Step 2: Setup Database
```bash
supabase login
supabase link --project-ref YOUR_REF
supabase db push
```

### Step 3: Install Dependencies
```bash
npm run setup
```

This installs all dependencies and runs preflight checks.

---

## 🚀 Running

### Option A: One-Command Start (Recommended)
```powershell
.\START.ps1  # Windows
```

### Option B: Manual (3 Terminals)
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Worker
npm run worker:dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## ✅ Verify It's Working

### 1. Check Health
```bash
curl http://localhost:8000/health
```
Expected: `{"status":"healthy"}`

### 2. Submit Test Intake
```bash
curl -X POST http://localhost:8000/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "tasks": [{"id":"1","title":"Test task"}],
    "guest": true
  }'
```
Expected: `{"jobId":"...","eta_seconds":...}`

### 3. Check Status
```bash
curl http://localhost:8000/status/JOB_ID_FROM_ABOVE
```
Expected: Status changes from `queued` → `running` → `done`

---

## 🐛 Troubleshooting (If Anything Goes Wrong)

### "Missing environment variable"
→ Check .env spelling matches exactly (no spaces)

### "Supabase connection failed"
→ Verify URL/keys are correct, run `supabase db push`

### "OpenAI API error"
→ Check API key, ensure you have credits ($5 minimum)

### "Worker not processing"
→ Check worker terminal for errors, ensure OPENAI_API_KEY is set

### Port already in use
→ Change PORT in .env or kill existing process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

---

## 🎉 You're Running!

Once all 3 services are up:
1. Visit http://localhost:3000
2. Fill the quiz form
3. Submit
4. Watch status page
5. See Notion plan + calendar events!

**Need help?** Run: `node preflight-check.js`

---

**Setup time**: 5 minutes
**First run**: Just works ✨

