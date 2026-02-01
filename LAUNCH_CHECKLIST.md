# AutoWebsites Pro - Business Launch Checklist

## Overview

AutoWebsites Pro is a **production-grade platform** with 110+ TypeScript files implementing the full sales pipeline. This checklist covers what's needed to go from "code complete" to "business operational."

---

## Phase 1: Environment & Configuration (Day 1)

### 1.1 Required Environment Variables
Set these in production `.env`:

| Variable | Status | Action |
|----------|--------|--------|
| `JWT_SECRET` | Uses default | Generate 32+ char random secret |
| `GMAIL_TOKEN_ENC_KEY` | Missing | Generate: `openssl rand -base64 32` |
| `CORS_ORIGINS` | Not set | Set to your dashboard domain |
| `COMPANY_NAME` | Placeholder | Your business name |
| `COMPANY_EMAIL` | Placeholder | Your contact email |
| `COMPANY_PHONE` | Placeholder | Your business phone |
| `COMPANY_ADDRESS` | Placeholder | Your business address |
| `COMPANY_LEGAL_NAME` | Placeholder | Legal entity name |
| `COMPANY_WEBSITE` | Placeholder | Your website URL |
| `DASHBOARD_URL` | Not set | Your deployed dashboard URL |

**Quick Commands to Generate Secrets:**
```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -hex 32

# Generate GMAIL_TOKEN_ENC_KEY (32 bytes base64)
openssl rand -base64 32
```

- [ ] Copy `.env.example` to `.env`
- [ ] Generate and set `JWT_SECRET`
- [ ] Generate and set `GMAIL_TOKEN_ENC_KEY`
- [ ] Set `CORS_ORIGINS` (e.g., `https://dashboard.yourdomain.com`)
- [ ] Set all `COMPANY_*` variables
- [ ] Set `DASHBOARD_URL`

### 1.2 Third-Party API Keys
| Service | Purpose | Setup Link |
|---------|---------|------------|
| Gmail OAuth | Send outreach emails | [Google Cloud Console](https://console.cloud.google.com) |
| Anthropic | AI analysis & pitches | [Anthropic Console](https://console.anthropic.com) |
| Google Places | Lead discovery | [Google Cloud Console](https://console.cloud.google.com) |
| Stripe | Payment processing | [Stripe Dashboard](https://dashboard.stripe.com) |
| Vercel | Deploy preview sites | [Vercel](https://vercel.com) |
| Supabase | Database & storage | Already configured |

### 1.3 Database Migrations
Run in Supabase SQL Editor (in order):
- [ ] `001_email_daily_stats.sql`
- [ ] `002_job_queue.sql`
- [ ] `003_overnight_runs.sql`
- [ ] `004_scheduler_locks.sql`
- [x] `005_auth_persistence.sql` (done)
- [x] `006_atomic_counters.sql` (done)

---

## Phase 2: Gmail & Email Setup (Day 1-2)

### 2.1 Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable Gmail API
- [ ] Configure OAuth consent screen (External or Internal)
- [ ] Create OAuth 2.0 credentials (Desktop app type)
- [ ] Add yourself as test user (if external)

### 2.2 Gmail Authorization
```bash
# Set credentials in .env first, then:
npx tsx src/email/gmail-client.ts --auth
```
- [ ] Complete OAuth flow
- [ ] Verify token saved to `.gmail-token.json`
- [ ] Test send: `npx tsx src/email/gmail-client.ts your@email.com`

### 2.3 Email Configuration
- [ ] Set `GMAIL_FROM_EMAIL` to authorized Gmail
- [ ] Set `GMAIL_FROM_NAME` to your business name
- [ ] Set `GMAIL_DAILY_QUOTA` (default 500, Gmail limit)

---

## Phase 3: Payment Setup (Day 2)

### 3.1 Stripe Configuration
- [ ] Create Stripe account
- [ ] Get API keys (test mode first)
- [ ] Set `STRIPE_SECRET_KEY` in .env
- [ ] Set `STRIPE_PUBLISHABLE_KEY` in .env
- [ ] Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Set `STRIPE_WEBHOOK_SECRET`

### 3.2 Pricing Configuration
Default tiers in `src/crm/proposal-generator.ts`:
- Essential: $2,500
- Professional: $5,000
- Enterprise: $10,000

- [ ] Customize pricing tiers if needed
- [ ] Update proposal templates with your terms

---

## Phase 4: Lead Discovery Setup (Day 2)

### 4.1 Google Places API
- [ ] Enable Places API in Google Cloud
- [ ] Create API key with Places API restriction
- [ ] Set `GOOGLE_PLACES_KEY` in .env
- [ ] Test: `npm run discover "plumbers Austin TX"`

### 4.2 Spider API (Optional - Deep Contact Extraction)
- [ ] Sign up at Spider.cloud (if using deep extraction)
- [ ] Set `SPIDER_API_KEY` in .env

---

## Phase 5: Branding & Content (Day 2-3)

### 5.1 Replace Placeholder Images
Located in `src/themes/` and `src/cli.ts`:
- [ ] Hero images for each industry
- [ ] Service images (4 per template)
- [ ] Before/after example images
- [ ] Company logo

### 5.2 Email Templates
Located in `src/email/sequences/`:
- [ ] Customize initial outreach template
- [ ] Customize follow-up sequences
- [ ] Add unsubscribe footer with your info
- [ ] Test all templates render correctly

### 5.3 Proposal & Contract Templates
- [ ] Add company logo to proposals
- [ ] Update terms and conditions
- [ ] Review contract language with legal
- [ ] Set payment terms (default: 50% upfront)

---

## Phase 6: Testing & Verification (Day 3)

### 6.1 Run Preflight Checks
```bash
npm run preflight -- --verbose
```
All checks should pass:
- [ ] Environment validation
- [ ] Database connectivity
- [ ] Gmail OAuth valid
- [ ] API keys working
- [ ] Theme generation
- [ ] Media generation

### 6.2 End-to-End Test
```bash
npm run e2e-test "plumbers in Austin TX"
```
Verifies full pipeline:
- [ ] Lead discovery works
- [ ] Website capture works
- [ ] Theme generation works
- [ ] Email composition works

### 6.3 Dashboard Testing
```bash
npm run dashboard
```
- [ ] Login works
- [ ] Lead list displays
- [ ] Campaign creation works
- [ ] Analytics display
- [ ] Job queue visible

---

## Phase 7: Deployment (Day 3-4)

### 7.1 Dashboard Deployment
Options:
- [ ] Deploy to Vercel/Railway/Render
- [ ] Set all environment variables in production
- [ ] Configure custom domain
- [ ] Enable HTTPS

### 7.2 Worker Deployment
```bash
npm run worker
```
- [ ] Deploy worker process (separate from dashboard)
- [ ] Configure process manager (PM2/systemd)
- [ ] Set up log aggregation

### 7.3 Overnight Scheduler
- [ ] Configure cron schedule (default: 10 PM)
- [ ] Set industries and locations to target
- [ ] Set daily limits (leads, emails)
- [ ] Test with `npm run overnight run-once`

---

## Phase 8: Legal & Compliance (Day 4-5)

### 8.1 CAN-SPAM Compliance
- [ ] Physical address in all emails
- [ ] Working unsubscribe link (already built)
- [ ] Accurate "From" name
- [ ] Clear identification as advertisement

### 8.2 GDPR (if targeting EU)
- [ ] Privacy policy on website
- [ ] Data processing documentation
- [ ] Consent mechanisms

### 8.3 Business Legal
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Refund policy
- [ ] Contract template reviewed by lawyer

---

## Phase 9: Operational Setup (Day 5)

### 9.1 Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure error alerting (Sentry, etc.)
- [ ] Dashboard health endpoint: `/health`

### 9.2 Alerting
Built-in alerting in `src/scheduler/alerting.ts`:
- [ ] Configure Slack webhook (optional)
- [ ] Configure email alerts
- [ ] Set alert thresholds

### 9.3 Backups
- [ ] Supabase automatic backups enabled
- [ ] Gmail token backup strategy
- [ ] Configuration backup

---

## Phase 10: Go-Live Checklist (Day 5-6)

### 10.1 Final Verification
- [ ] All env vars set in production
- [ ] Database migrations complete
- [ ] Gmail authorized and tested
- [ ] Stripe in live mode
- [ ] Dashboard accessible
- [ ] Worker running
- [ ] Health checks passing

### 10.2 First Campaign
```bash
# Test with a small batch first
npm run discover "your target industry your city" -- --max-results 5
npm run send test your@email.com
```

### 10.3 Soft Launch
- [ ] Start with 1-2 industries
- [ ] Start with 1-2 locations
- [ ] Monitor email deliverability
- [ ] Check for bounces/spam reports
- [ ] Iterate on email templates

---

## Quick Reference: Key Commands

```bash
# Discovery
npm run discover "plumbers Austin TX"

# Full pipeline for one business
npm run outreach https://example-plumber.com

# Send test email
npm run send test your@email.com

# Start dashboard
npm run dashboard

# Start background worker
npm run worker

# Start overnight automation
npm run overnight start

# Health check
npm run health

# Preflight validation
npm run preflight
```

---

## What's Already Built (No Work Needed)

| Feature | Status |
|---------|--------|
| Lead discovery (Google Places) | Complete |
| Website capture & scoring | Complete |
| 10-theme generation | Complete |
| Email sequences | Complete |
| Gmail integration | Complete |
| AI analysis & pitches | Complete |
| CRM & activity logging | Complete |
| Proposal/contract PDFs | Complete |
| Stripe payments | Complete |
| Dashboard with auth | Complete |
| Overnight automation | Complete |
| Media generation (GIF/video) | Complete |
| Job queue & worker | Complete |
| Health checks | Complete |
| Security (CSRF, rate limiting) | Complete |

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Environment Setup | 2-4 hours | None |
| 2. Gmail Setup | 2-4 hours | Phase 1 |
| 3. Stripe Setup | 1-2 hours | None |
| 4. Discovery Setup | 1 hour | None |
| 5. Branding | 4-8 hours | Design assets |
| 6. Testing | 2-4 hours | Phases 1-5 |
| 7. Deployment | 4-8 hours | Phase 6 |
| 8. Legal | 4-8 hours | Lawyer review |
| 9. Operations | 2-4 hours | Phase 7 |
| 10. Go-Live | 2-4 hours | All phases |

**Total: 5-7 days** to full production launch

---

## Validation Commands

Use these commands to verify each phase:

```bash
# Phase 1: Verify environment is configured
npm run preflight -- --quick

# Phase 2: Verify Gmail is working
npm run send verify
npm run send test your@email.com

# Phase 3: Verify Stripe (manual - check Stripe dashboard)
# Visit https://dashboard.stripe.com/test/payments

# Phase 4: Verify discovery
npm run discover "plumbers Austin TX" -- --max-results 3

# Phase 5: Verify theme generation
npm run generate https://example.com

# Phase 6: Full verification
npm run preflight -- --verbose
npm run e2e-test "plumbers in Austin TX"

# Phase 7+: Health check (after deployment)
npm run health -- --verbose
curl https://your-dashboard.com/api/health
```

---

## Troubleshooting

### Gmail Authorization Issues
```bash
# Re-authorize Gmail
npx tsx src/email/gmail-client.ts --auth

# Check token status
ls -la .gmail-token.json
```

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check if your IP is allowlisted in Supabase dashboard
- Run migrations if tables are missing

### API Key Issues
```bash
# Test individual services
npm run health -- --verbose
```

---

## Next Steps

1. Start with Phase 1 - get all environment variables configured
2. Complete Gmail OAuth setup (Phase 2) - this is the core capability
3. Run preflight checks to validate everything
4. Do a small test campaign before scaling up
