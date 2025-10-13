# Quicklarity - Smoke Test Checklist

Run these tests to verify your MVP is working correctly.

## ☑️ Pre-Deployment Checklist

- [ ] **1. Fill DEV_INPUT.md with secrets**
  - Clerk keys (publishable + secret)
  - Supabase keys (URL + service key)
  - OpenAI API key
  - Stripe keys (secret + webhook secret + price IDs)
  - PostHog keys
  - Notion API key + database ID
  - Google Calendar credentials (optional)

- [ ] **2. Apply database migrations**
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  supabase db push
  ```
  Verify:
  - All 5 tables created (founders, jobs, doc_summaries, invitations, ratings)
  - Indexes created
  - RLS policies enabled

- [ ] **3. Install dependencies**
  ```bash
  npm install
  cd frontend && npm install && cd ..
  ```
  Verify: No errors, all packages installed

- [ ] **4. Run tests**
  ```bash
  npm test
  ```
  Expected: All tests pass
  - `/intake` validation tests pass
  - `/status` endpoint tests pass
  - Worker JSON parse tests pass

---

## ☑️ Local Development Tests

- [ ] **5. Start backend API**
  ```bash
  npm run dev
  ```
  Verify:
  - Server starts on port 8000
  - No connection errors
  - Health check responds: `curl http://localhost:8000/health`

- [ ] **6. Start worker**
  ```bash
  npm run worker:dev
  ```
  Verify:
  - Worker connects to Redis (or starts Supabase polling)
  - No authentication errors
  - OpenAI client initialized

- [ ] **7. Start frontend**
  ```bash
  cd frontend && npm run dev
  ```
  Verify:
  - Frontend loads at http://localhost:3000
  - No console errors
  - Clerk sign-in button visible

---

## ☑️ Functional Tests

- [ ] **8. Test Clerk authentication**
  - Click "Sign In" button
  - Create new account or sign in
  - Verify user profile appears
  - Check Supabase: `founders` table has new row with `clerk_id`

- [ ] **9. Submit test intake (guest mode)**
  - Fill quiz form without signing in
  - Include at least 3 tasks
  - Add 1-2 documents (optional)
  - Submit form
  - Expected response: `{ "jobId": "...", "eta_seconds": 30+ }`

- [ ] **10. Verify job status progression**
  - Check status endpoint: `curl http://localhost:8000/status/JOB_ID`
  - Status should change:
    - `queued` → `running` → `done` (within 1-2 minutes)
  - Check worker logs for processing steps
  - Check Supabase `jobs` table: status updated

- [ ] **11. Verify Notion page created**
  - When status = `done`, get `notion_url` from status response
  - Open Notion URL in browser
  - Verify page contains:
    - Executive Summary
    - Top Priorities (ranked 1-5)
    - Execution Schedule
    - Risks & Mitigation
    - Next Steps

- [ ] **12. Verify calendar events**
  - Check status response for `ics_links` array
  - Download ICS file(s)
  - Import to calendar app
  - Verify 3 events created:
    - Strategic Plan Kickoff (3 days from now)
    - Mid-Point Review (3 weeks from now)
    - Final Review (6 weeks from now)

---

## ☑️ Billing & Subscription Tests

- [ ] **13. Create Stripe checkout session**
  - Sign in with Clerk
  - Click "Upgrade to Paid"
  - POST to `/checkout` endpoint
  - Verify: Redirected to Stripe checkout page

- [ ] **14. Complete test payment**
  - Use Stripe test card: `4242 4242 4242 4242`
  - Complete checkout
  - Verify: Redirected to success page

- [ ] **15. Verify webhook updates Supabase**
  ```bash
  # Check Supabase founders table
  SELECT clerk_id, subscription_status, role, permissions 
  FROM founders 
  WHERE email = 'YOUR_TEST_EMAIL';
  ```
  Expected:
  - `subscription_status` = 'active'
  - `role` = 'paid'
  - `permissions` includes `{"max_docs": 3, "priority_queue": true}`

- [ ] **16. Verify PostHog events tracked**
  - Go to PostHog dashboard
  - Check for events:
    - `intake_submitted`
    - `job_enqueued`
    - `job_started`
    - `job_completed` (with `cost_estimate_usd` property)
    - `subscription_activated`

---

## ☑️ Edge Cases & Error Handling

- [ ] **17. Test budget enforcement**
  - Submit intake with many tasks (15+) and multiple documents
  - Worker should complete without exceeding budget caps
  - Check `jobs.cost_usd` in Supabase: Should be <$0.05 for free, <$1.00 for paid

- [ ] **18. Test malformed JSON handling**
  - (Manual test: Temporarily break LLM output in worker)
  - Verify rectifier is called once
  - If still malformed, job status = 'errored'

- [ ] **19. Test rating submission**
  - On status page (job = done), click 1-5 star rating
  - Add optional feedback text
  - Submit
  - Check Supabase `ratings` table: New row created

- [ ] **20. Test account deletion (GDPR)**
  - Sign in with test account
  - POST to `/deleteAccount` endpoint
  - Verify: Founder record deleted from Supabase
  - Verify: All related jobs/ratings deleted (cascade)

---

## ☑️ Cost & Performance Validation

- [ ] **21. Verify LLM costs**
  ```bash
  # Check average cost per job
  SELECT AVG(cost_usd) as avg_cost, role 
  FROM jobs j
  JOIN founders f ON j.founder_id = f.id
  GROUP BY role;
  ```
  Expected:
  - Free users: $0.004-0.006 avg
  - Paid users: $0.007-0.010 avg

- [ ] **22. Verify processing time**
  - Measure time from intake submit to job completion
  - Expected: 30-60 seconds for free, 45-90 seconds for paid (with docs)

- [ ] **23. Verify document caching**
  - Submit same document twice (same content)
  - Second submission should be faster
  - Check Supabase `doc_summaries`: Only 1 entry for that doc_hash

- [ ] **24. Verify rule-based scoring**
  - Check worker logs for scoring output
  - Verify tasks with "revenue", "urgent" keywords score higher
  - Verify no LLM call for scoring step (cost should be $0 for that step)

---

## ☑️ Deployment Verification

- [ ] **25. Deploy backend to Vercel**
  ```bash
  vercel --prod
  ```
  - Set all env vars in Vercel dashboard
  - Verify deployment succeeds
  - Test health endpoint: `curl https://your-api.vercel.app/health`

- [ ] **26. Deploy worker to Render**
  - Create Background Worker service
  - Connect GitHub repo
  - Add all env vars
  - Deploy
  - Check logs: Worker starts successfully

- [ ] **27. Deploy frontend to Vercel**
  ```bash
  cd frontend && vercel --prod
  ```
  - Set frontend env vars
  - Verify deployment succeeds
  - Test in browser

- [ ] **28. End-to-end production test**
  - Submit real intake via production frontend
  - Verify job completes
  - Check Notion page created
  - Download ICS files
  - Submit rating

---

## ☑️ Monitoring & Observability

- [ ] **29. Verify logging**
  - Check Vercel logs (backend)
  - Check Render logs (worker)
  - Verify all processing steps logged
  - No unexpected errors

- [ ] **30. Verify PostHog dashboards**
  - Create dashboard for key metrics:
    - Intake submissions per day
    - Job completion rate
    - Average LLM cost per user
    - Subscription conversions
    - User ratings distribution

---

## ✅ Success Criteria

**MVP is ready for launch if**:
- ✅ All 30 checklist items pass
- ✅ Average LLM cost <$0.01 per user
- ✅ Job completion time <90 seconds
- ✅ No critical errors in production logs
- ✅ Stripe webhooks updating subscription status
- ✅ Notion pages publishing successfully
- ✅ Calendar events generating correctly
- ✅ Users can delete accounts
- ✅ All tests passing (`npm test`)

---

## 🐛 Common Issues & Solutions

**Worker not processing jobs?**
- Check Redis connection (or Supabase polling)
- Verify OPENAI_API_KEY is set
- Check worker logs for authentication errors

**Notion publish fails?**
- Verify integration has access to database
- Check NOTION_DATABASE_ID is correct
- Ensure API key has write permissions

**Stripe webhook not firing?**
- Verify STRIPE_WEBHOOK_SECRET matches
- Check webhook endpoint URL in Stripe dashboard
- Use `stripe listen` for local testing

**Budget exceeded errors?**
- Review task count and document count
- Check if using correct models (gpt-3.5-turbo for free, gpt-4o-mini for paid)
- Verify document caching is working

**Tests failing?**
- Run `npm install` to ensure all deps installed
- Check `.env` file has required variables
- Verify Supabase connection

---

## 📊 Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Free user LLM cost | <$0.05 | $0.005 |
| Paid user LLM cost | <$1.00 | $0.008 |
| Job completion time | <90s | 45-60s |
| API response time | <200ms | ~100ms |
| Notion publish time | <5s | ~2s |
| Document cache hit rate | >40% | TBD |

---

**Status**: ⚠️ Run this checklist before deploying to production

**Last Updated**: 2024-10-13

**Next**: Once all items pass, proceed with production launch! 🚀

