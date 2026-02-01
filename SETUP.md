# AutoWebsites Pro - Complete Setup Guide

## Overview
This guide provides step-by-step instructions for obtaining and configuring all API keys and environment variables needed to run AutoWebsites Pro.

---

## Quick Reference: All Environment Variables

| Variable | Required | Service |
|----------|----------|---------|
| SUPABASE_URL | **Yes** | Database |
| SUPABASE_ANON_KEY | **Yes** | Database |
| ANTHROPIC_API_KEY | No | AI (Claude) |
| GMAIL_CLIENT_ID | No | Email |
| GMAIL_CLIENT_SECRET | No | Email |
| GMAIL_FROM_EMAIL | No | Email |
| STRIPE_SECRET_KEY | No | Payments |
| STRIPE_WEBHOOK_SECRET | No | Payments |
| GOOGLE_PLACES_KEY | No | Lead Discovery |
| JWT_SECRET | No | Dashboard Auth |

---

## 1. SUPABASE (Required - Database)

Supabase provides the PostgreSQL database and file storage. **This is the only required service.**

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project" and sign up (GitHub login available)
3. Verify your email if required

### Step 2: Create a New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Enter project details:
   - **Name**: `autowebsites` (or your preference)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait ~2 minutes for setup

### Step 3: Get Your API Keys
1. In your project dashboard, click **Settings** (gear icon) -> **API**
2. Copy these values:
   - **Project URL** -> `SUPABASE_URL`
   - **anon public** key -> `SUPABASE_ANON_KEY`
   - **service_role** key (optional) -> `SUPABASE_SERVICE_KEY`

### Step 4: Set Up Database Tables
1. Go to **SQL Editor** in Supabase dashboard
2. Run the schema from `src/db/schema.sql` (copy/paste the entire file)
3. Run any additional migrations from `src/db/schema-v2.sql`

### Add to .env:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. ANTHROPIC (Optional - AI Features)

Enables AI-powered website analysis, pitch generation, and content creation.

### Step 1: Create Anthropic Account
1. Go to https://console.anthropic.com
2. Click "Sign Up" and create an account
3. Verify your email

### Step 2: Add Payment Method
1. Go to **Settings** -> **Billing**
2. Add a credit card (required to get API access)
3. Optionally set a usage limit to control costs

### Step 3: Generate API Key
1. Go to **API Keys** in the console
2. Click "Create Key"
3. Name it (e.g., "autowebsites-production")
4. Copy the key immediately (starts with `sk-ant-`)

### Pricing Note:
- Claude Sonnet: ~$3 per 1,000 requests
- Typical usage: $10-50/month depending on volume

### Add to .env:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. GOOGLE GMAIL API (Optional - Email Sending)

Enables sending emails via Gmail with 500 emails/day free quota.

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Click the project dropdown (top left) -> "New Project"
4. Name it "AutoWebsites" and click "Create"

### Step 2: Enable Gmail API
1. Go to **APIs & Services** -> **Library**
2. Search for "Gmail API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** -> **OAuth consent screen**
2. Select "External" user type -> "Create"
3. Fill in required fields:
   - **App name**: AutoWebsites
   - **User support email**: your email
   - **Developer contact**: your email
4. Click "Save and Continue"
5. On Scopes page, click "Add or Remove Scopes"
6. Find and select `https://www.googleapis.com/auth/gmail.send`
7. Click "Update" then "Save and Continue"
8. Add your email as a test user
9. Click "Save and Continue" then "Back to Dashboard"

### Step 4: Create OAuth Credentials
1. Go to **APIs & Services** -> **Credentials**
2. Click "Create Credentials" -> "OAuth client ID"
3. Application type: **Desktop app**
4. Name: "AutoWebsites CLI"
5. Click "Create"
6. Copy **Client ID** and **Client Secret**

### Step 5: Authorize the Application
After adding credentials to .env, run the app. It will:
1. Print an authorization URL
2. Open it in your browser
3. Sign in and grant permission
4. Copy the authorization code back to the terminal
5. Token is saved to `.gmail-token.json`

### Add to .env:
```
GMAIL_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
GMAIL_FROM_EMAIL=your-email@gmail.com
GMAIL_FROM_NAME=Your Company Name
GMAIL_DAILY_QUOTA=500
```

---

## 4. STRIPE (Optional - Payment Processing)

Enables payment links, invoices, and payment tracking.

### Step 1: Create Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Sign up with email
3. Verify your email

### Step 2: Get API Keys (Test Mode First)
1. In Stripe Dashboard, ensure **Test mode** is ON (toggle top right)
2. Go to **Developers** -> **API keys**
3. Copy the **Secret key** (starts with `sk_test_`)

### Step 3: Set Up Webhook (For Payment Notifications)
1. Go to **Developers** -> **Webhooks**
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Go Live (When Ready)
1. Complete Stripe account verification
2. Toggle **Test mode** OFF
3. Get new live keys (start with `sk_live_`)
4. Create new webhook for production URL

### Add to .env:
```
# Test mode keys (start with these)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Switch to live keys when ready for production
# STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
```

---

## 5. GOOGLE PLACES API (Optional - Lead Discovery)

Enables searching for businesses by location to find leads.

### Step 1: Enable Places API
1. Go to https://console.cloud.google.com
2. Select your project (same one from Gmail setup)
3. Go to **APIs & Services** -> **Library**
4. Search for "Places API" and enable it
5. Also enable "Geocoding API" for address lookups

### Step 2: Create API Key
1. Go to **APIs & Services** -> **Credentials**
2. Click "Create Credentials" -> "API key"
3. Copy the key
4. Click "Edit API key" to restrict it:
   - Under "API restrictions", select "Restrict key"
   - Select only: Places API, Geocoding API
   - Click "Save"

### Step 3: Enable Billing
1. Go to **Billing** in Google Cloud Console
2. Link a billing account (required for Places API)
3. Note: Google provides $200/month free credits

### Pricing Note:
- Place Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- Free tier: $200/month credit (~6,000 searches)

### Add to .env:
```
GOOGLE_PLACES_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. DASHBOARD CONFIGURATION (Optional)

### JWT Secret
Used for dashboard authentication. Generate a secure random string.

```bash
# Generate a secure secret (run in terminal)
openssl rand -hex 32
```

### Add to .env:
```
JWT_SECRET=your-32-character-or-longer-secret-here
DASHBOARD_PORT=3001
DASHBOARD_URL=http://localhost:3001
```

---

## 7. COMPANY INFORMATION (Optional)

Used in emails, proposals, and contracts.

### Add to .env:
```
COMPANY_NAME=Your Company Name
COMPANY_EMAIL=contact@yourcompany.com
COMPANY_PHONE=+1-555-123-4567
COMPANY_ADDRESS=123 Main St, City, State 12345
COMPANY_LEGAL_NAME=Your Company LLC
COMPANY_WEBSITE=https://yourcompany.com
```

---

## 8. VERCEL (Optional - Deployment)

For deploying generated websites to production URLs.

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up (GitHub login recommended)

### Step 2: Get API Token
1. Go to **Settings** -> **Tokens**
2. Click "Create Token"
3. Name: "autowebsites-deploy"
4. Scope: Full Account
5. Copy the token

### Add to .env:
```
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Verification

After setting up, run the preflight checks:

```bash
npm run preflight
```

This will validate all configured services and show which features are enabled.

### Preflight Options

```bash
# Full check
npm run preflight

# Verbose output
npm run preflight -- --verbose

# Quick check (essential services only)
npm run preflight -- --quick

# Skip optional services
npm run preflight -- --skip-optional

# Send a test email
npm run preflight -- --test-email your@email.com

# Attempt to fix issues automatically
npm run preflight -- --fix
```

---

## Cost Summary

| Service | Free Tier | Typical Monthly Cost |
|---------|-----------|---------------------|
| Supabase | 500MB DB, 1GB storage | $0 (free tier) |
| Anthropic | None | $10-50 |
| Gmail | 500 emails/day | $0 |
| Stripe | No monthly fee | 2.9% + $0.30 per transaction |
| Google Places | $200 credit | $0 (within free tier) |
| Vercel | 100 deployments | $0 (hobby tier) |

**Estimated total for small-scale use: $10-50/month** (primarily AI costs)

---

## Troubleshooting

### Common Issues

**"SUPABASE_URL is required"**
- Ensure you've copied `.env.example` to `.env`
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are set correctly

**"Gmail authorization failed"**
- Run `npx tsx src/email/gmail-client.ts --auth` to re-authorize
- Ensure you've added your email as a test user in Google Cloud Console

**"Stripe API key invalid"**
- Check that you're using the correct key format (sk_test_ or sk_live_)
- Verify the key hasn't been revoked in Stripe dashboard

**"Google Places API error"**
- Ensure billing is enabled on your Google Cloud project
- Check that the API key has Places API and Geocoding API enabled

### Getting Help

If you encounter issues:
1. Run `npm run preflight -- --verbose` for detailed diagnostics
2. Check the logs in `./logs` directory
3. Review this setup guide for missing steps

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Set up Supabase project and add credentials
- [ ] Run database migrations (`src/db/schema.sql`, `src/db/schema-v2.sql`)
- [ ] Run `npm run preflight` to verify setup
- [ ] (Optional) Add Anthropic API key for AI features
- [ ] (Optional) Set up Gmail OAuth for email
- [ ] (Optional) Add Stripe keys for payments
- [ ] (Optional) Add Google Places key for lead discovery
