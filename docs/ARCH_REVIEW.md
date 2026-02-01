# Architecture Review — AutoWebsites Pro
Generated: 2026-01-26 (Full Audit)
Updated: 2026-01-31 (Incremental Audit)

## Executive Summary

AutoWebsites Pro is a lead generation and outreach automation platform with significant security vulnerabilities that require immediate attention. While the codebase demonstrates good foundational practices (TypeScript, Zod validation, structured logging), I identified **5 CRITICAL**, **12 HIGH**, and **15 MEDIUM** severity issues across security, architecture, and performance domains.

**Critical Findings:**
1. **Command injection vulnerability** in Vercel deployment (RCE risk)
2. **SQL injection** in lead search/filter operations
3. **Race conditions** in overnight scheduler (duplicate processing)
4. **Unencrypted OAuth tokens** stored on disk
5. **Missing access control** in lead tag operations

**Top 3 Recommendations:**
1. Immediately patch command injection in `deploy.ts` - use `execFileSync` instead of `execSync`
2. Implement proper input sanitization for PostgREST queries in `lead-model.ts`
3. Add mutex/lock to overnight scheduler to prevent concurrent runs

---

## Repo Map

### Core Modules
| Module | Path | Purpose | Lines |
|--------|------|---------|-------|
| CLI | `src/cli.ts` | Command-line interface | 1915 |
| Lead Model | `src/crm/lead-model.ts` | Lead CRUD operations | 659 |
| Email Composer | `src/email/composer.ts` | MJML email templating | 858 |
| Overnight Runner | `src/overnight/runner.ts` | Automated outreach orchestration | 666 |
| Preview Generator | `src/preview/lead-website-generator.ts` | Website preview creation | 933 |

### New Components (Not in Codebase Map)
| Module | Path | Purpose |
|--------|------|---------|
| Overnight Scheduler | `src/overnight/scheduler.ts` | Cron-based automation |
| Overnight Config | `src/overnight/config.ts` | Quota management |
| Content Generator | `src/preview/content-generator.ts` | AI content generation |
| Industry Templates | `src/preview/industry-templates/*` | HTML templates |
| Dashboard Overnight | `src/dashboard/routes/overnight.ts` | Overnight runs API |

### External Integrations
| Service | Client | Purpose |
|---------|--------|---------|
| Supabase | `src/utils/supabase.ts` | PostgreSQL database |
| Gmail | `src/email/gmail-client.ts` | Email sending |
| Vercel | `src/preview/deploy.ts` | Preview deployment |
| Claude (Anthropic) | `src/ai/claude-client.ts` | AI content generation |
| Yelp | `src/discovery/yelp-scraper.ts` | Lead discovery |

---

## Critical Workflows

### Overnight Outreach Flow
```
Scheduler (cron) → Runner.execute()
  → discoverLeads() → Yelp/YellowPages
  → processLead() loop:
    → LeadModel.create()
    → LeadWebsiteGenerator.generate()
    → deployToVercel()
    → sendEmail()
    → LeadModel.update()
  → saveRun() → Supabase
```

### Authentication Flow
```
POST /api/auth/login
  → validateCredentials()
  → bcrypt.compare()
  → checkLoginAttempts() [in-memory]
  → generateJWT() with tokenVersion
  → Return tokens
```

### Email Processing Flow
```
POST /api/campaigns/process
  → sequenceEngine.processNextEmails()
  → For each pending email:
    → LeadModel.get()
    → EmailComposer.compose()
    → sendEmail()
    → LeadModel.recordEmailSent()
```

---

## Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | File/Area | Priority |
|----|------|----------|------------|------------|-----------|----------|
| R1 | Command injection in Vercel deploy | Critical | Medium | Use execFileSync, sanitize inputs | deploy.ts:76 | P0 |
| R2 | SQL injection in lead search | Critical | High | Escape PostgREST filter syntax | lead-model.ts:360 | P0 |
| R3 | Race condition in scheduler | Critical | High | Add mutex/database lock | scheduler.ts:105 | P0 |
| R4 | Unencrypted OAuth tokens | High | High | Encrypt tokens at rest | gmail-client.ts:46 | P0 |
| R5 | Missing CSRF protection | Medium | Medium | Add CSRF tokens to forms | routes/*.ts | P1 |
| R6 | In-memory token versions | High | High | Store in Redis/DB | auth.ts:40 | P1 |
| R7 | N+1 queries in lead operations | High | High | Use atomic DB operations | lead-model.ts | P1 |
| R8 | No idempotency in overnight | High | Medium | Add idempotency keys | runner.ts:324 | P1 |
| R9 | Path traversal in preview gen | Medium | Low | Validate UUIDs, check paths | lead-website-generator.ts:113 | P1 |
| R10 | Template injection in emails | High | Medium | Escape all variables | composer.ts:750 | P1 |
| R11 | Quota bypass via race | High | Medium | Atomic quota reservation | config.ts:78 | P1 |
| R12 | Missing database indexes | High | High | Add composite indexes | migrations/*.sql | P2 |
| R13 | Inefficient stats queries | Medium | High | Use DB aggregation | lead-model.ts:391 | P2 |
| R14 | XSS in email attributes | Low | Low | Escape HTML attributes | lead-website-generator.ts:702 | P3 |
| R15 | Connection pooling gaps | Medium | Medium | Configure pool options | supabase.ts | P2 |

---

## Prioritized Backlog (42 items)

| ID | Item | Why | File/Area | Priority | Effort | Impact |
|----|------|-----|-----------|----------|--------|--------|
| B1 | Fix command injection in deploy.ts | RCE vulnerability | deploy.ts:76 | P0 | Low | Critical |
| B2 | Sanitize PostgREST filter inputs | SQL injection | lead-model.ts:360 | P0 | Low | Critical |
| B3 | Sanitize date filter inputs | SQL injection | lead-model.ts:376 | P0 | Low | Critical |
| B4 | Add mutex to overnight scheduler | Race condition | scheduler.ts:105 | P0 | Medium | Critical |
| B5 | Encrypt Gmail OAuth tokens | Credential theft | gmail-client.ts:46 | P0 | Medium | High |
| B6 | Add access control to tag operations | Unauthorized modification | lead-model.ts:599 | P0 | Medium | Critical |
| B7 | Migrate token versions to Redis/DB | Session fixation | auth.ts:40 | P1 | High | High |
| B8 | Add CSRF protection to all routes | CSRF attacks | routes/*.ts | P1 | Medium | High |
| B9 | Fix email template injection | HTML injection | composer.ts:750 | P1 | Low | High |
| B10 | Add idempotency to lead processing | Duplicate entries | runner.ts:324 | P1 | Medium | High |
| B11 | Implement atomic quota reservation | Quota bypass | config.ts:78 | P1 | High | High |
| B12 | Add path traversal validation | Directory traversal | lead-website-generator.ts:113 | P1 | Low | Medium |
| B13 | Fix N+1 in recordEmailOpened | Performance | lead-model.ts:523 | P1 | Low | High |
| B14 | Fix N+1 in recordEmailClicked | Performance | lead-model.ts:554 | P1 | Low | High |
| B15 | Fix N+1 in addTag | Performance | lead-model.ts:599 | P1 | Medium | High |
| B16 | Add missing email_log indexes | Performance | migrations/003 | P1 | Low | High |
| B17 | Improve JWT secret validation | Weak secrets | server.ts:42 | P1 | Low | Medium |
| B18 | Add rate limiting to /process | Abuse prevention | campaigns.ts:294 | P2 | Low | Medium |
| B19 | Fix bulkAddTag race condition | Data loss | lead-model.ts:626 | P2 | Medium | Medium |
| B20 | Add composite indexes for job queue | Performance | migrations/002 | P2 | Low | Medium |
| B21 | Use DB aggregation for stats | Performance | lead-model.ts:391 | P2 | High | High |
| B22 | Add error handling to getQuotas | Reliability | config.ts:69 | P2 | Low | Medium |
| B23 | Configure connection pooling | Reliability | supabase.ts | P2 | Low | Medium |
| B24 | Add input validation to lead creation | Data quality | lead-model.ts:179 | P2 | Low | Medium |
| B25 | Fix unsafe JSONB casting | Reliability | migrations/003:186 | P2 | Low | Medium |
| B26 | Add transaction support to overnight | Data consistency | runner.ts:304 | P2 | High | Medium |
| B27 | Standardize tag validation schema | Consistency | leads.ts:48 | P2 | Low | Low |
| B28 | Add graceful quota exhaustion handling | UX | runner.ts:391 | P2 | Medium | Medium |
| B29 | Improve config validation with Zod | Input validation | config.ts:215 | P2 | Medium | Medium |
| B30 | Escape XSS in email attributes | XSS prevention | lead-website-generator.ts:702 | P3 | Low | Low |
| B31 | Add CSRF to unsubscribe form | Security | unsubscribe.ts:290 | P3 | Low | Low |
| B32 | Fix activity stats inefficiency | Performance | activity-logger.ts:174 | P3 | Medium | Low |
| B33 | Fix email analytics inefficiency | Performance | analytics.ts:73 | P3 | Medium | Low |
| B34 | Add tests for overnight module | Coverage | __tests__/ | P2 | High | Medium |
| B35 | Add tests for preview generator | Coverage | __tests__/ | P2 | High | Medium |
| B36 | Add tests for dashboard routes | Coverage | __tests__/ | P2 | High | Medium |
| B37 | Add integration tests for auth flow | Coverage | __tests__/ | P2 | Medium | Medium |
| B38 | Document overnight system | Maintainability | docs/ | P3 | Medium | Low |
| B39 | Update CODEBASE_MAP.md | Maintainability | docs/ | P3 | Low | Low |
| B40 | Split cli.ts (1915 lines) | Maintainability | cli.ts | P3 | High | Low |
| B41 | Refactor lead-model.ts | Maintainability | lead-model.ts | P3 | High | Low |
| B42 | Add monitoring/alerting | Observability | scheduler/ | P3 | High | Medium |

---

## Bugs Found

### B-01: MJML Compilation Warning
**Location:** `src/email/composer.ts` (during template compilation)
**Severity:** Low
**Issue:** MJML warning: "mj-section cannot be used inside mj-column"
**Reproduction:** Run `npm test` - see stderr output
**Fix:** Review MJML template structure in email templates

### B-02: Potential Memory Leak in Token Version Map
**Location:** `src/dashboard/auth.ts:40`
**Severity:** Medium
**Issue:** `tokenVersions` Map grows unbounded as users are added
**Root Cause:** No cleanup of old entries
**Fix:**
```typescript
// Add TTL cleanup or move to Redis with EXPIRE
const TOKEN_VERSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
setInterval(() => {
  const cutoff = Date.now() - TOKEN_VERSION_TTL;
  for (const [key, data] of tokenVersions.entries()) {
    if (data.lastUpdated < cutoff) tokenVersions.delete(key);
  }
}, 60 * 60 * 1000); // Hourly cleanup
```

---

## Security Issues

### S-01: Command Injection (CRITICAL)
**Location:** `src/preview/deploy.ts:76`
**Category:** A03:2021 - Injection
**Code:**
```typescript
const result = execSync(`vercel ${args.join(' ')}`, { cwd: directory });
```
**Impact:** Remote code execution via malicious `projectName`
**Fix:**
```diff
-const result = execSync(`vercel ${args.join(' ')}`, { cwd: directory });
+const result = execFileSync('vercel', args, { cwd: directory });
```

### S-02: SQL Injection (CRITICAL)
**Location:** `src/crm/lead-model.ts:360`
**Category:** A03:2021 - Injection
**Code:**
```typescript
query = query.or(`business_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
```
**Impact:** Filter bypass, data exfiltration
**Fix:**
```diff
-query = query.or(`business_name.ilike.%${filter.search}%,...`);
+const escaped = (filter.search || '').replace(/[%_\\]/g, '\\$&');
+query = query.or(`business_name.ilike.%${escaped}%,...`);
```

### S-03: Unencrypted Token Storage (HIGH)
**Location:** `src/email/gmail-client.ts:46`
**Category:** A02:2021 - Cryptographic Failures
**Code:**
```typescript
fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
```
**Impact:** Gmail account compromise if filesystem accessed
**Fix:** Encrypt with AES-256-CBC before writing, decrypt on read

### S-04: Missing CSRF Protection (MEDIUM)
**Location:** `src/dashboard/routes/*.ts`
**Category:** A01:2021 - Broken Access Control
**Impact:** Attackers can craft malicious forms to modify leads/campaigns
**Fix:** Add `csurf` middleware to all state-changing routes

### S-05: In-Memory Token Versions (HIGH)
**Location:** `src/dashboard/auth.ts:40`
**Category:** A07:2021 - Authentication Failures
**Impact:** Password change doesn't invalidate tokens on other instances
**Fix:** Store token versions in Supabase or Redis

---

## Performance Hotspots

### P-01: N+1 Query in recordEmailOpened
**Location:** `src/crm/lead-model.ts:523-552`
**Metrics:** 3 queries per email open (SELECT, UPDATE, SELECT)
**Diagnosis:** Read-modify-write pattern instead of atomic increment
**Current Complexity:** O(3n) queries
**Proposed Complexity:** O(n) queries
**Fix:** Use RPC `increment_emails_opened` consistently, add fallback with single atomic UPDATE

### P-02: Stats Aggregation in JavaScript
**Location:** `src/crm/lead-model.ts:391-502`
**Metrics:** Fetches all leads (potentially 10K+ rows) for simple counts
**Diagnosis:** Client-side aggregation instead of GROUP BY
**Current Complexity:** O(n) data transfer + O(n) memory
**Proposed Complexity:** O(1) data transfer
**Fix:** Create `get_lead_stats_aggregated()` PostgreSQL function

### P-03: Missing Composite Indexes
**Location:** `src/db/migrations/002_job_queue.sql`
**Metrics:** Job claiming requires full index scan
**Diagnosis:** Partial index doesn't cover ORDER BY columns
**Fix:**
```sql
CREATE INDEX idx_job_queue_claim ON job_queue(priority DESC, created_at ASC)
WHERE status = 'pending';
```

### P-04: Inefficient Bulk Tag Operations
**Location:** `src/crm/lead-model.ts:626-654`
**Metrics:** 2 queries per batch (SELECT all, then UPSERT)
**Diagnosis:** Read-modify-write with potential race condition
**Fix:** Use PostgreSQL `array_append_unique()` function

### P-05: Large File Complexity
**Location:** `src/cli.ts` (1915 lines)
**Metrics:** Cyclomatic complexity unmeasured but high
**Diagnosis:** Monolithic command handler
**Fix:** Split into separate command modules under `src/cli/commands/`

---

## Maintainability

### Test Coverage Gaps
| Module | Test File | Coverage |
|--------|-----------|----------|
| overnight/* | None | 0% |
| preview/* | None | 0% |
| dashboard/routes/* | Partial (api.test.ts) | ~30% |
| crm/lead-model.ts | None | 0% |
| scheduler/queue.ts | None | 0% |

**Recommendation:** Add tests for:
1. Overnight runner (critical business logic)
2. Preview generator (user-facing output)
3. Lead model (data integrity)

### Complexity Hotspots
| File | Lines | Concern |
|------|-------|---------|
| cli.ts | 1915 | Should be split into command modules |
| lead-website-generator.ts | 933 | Consider extracting template logic |
| queue.ts | 917 | Well-structured but large |
| email/composer.ts | 858 | Template logic could be extracted |

### Code Smells
1. **Duplication:** N+1 patterns in `recordEmailOpened`, `recordEmailClicked`, `addTag`
2. **Magic Numbers:** `delayBetweenLeads: 30000` should be configurable constant
3. **Missing Error Handling:** Many async functions swallow errors silently
4. **Unclear Naming:** `run` property and `execute()` method in OvernightRunner

### Documentation Gaps
1. No API documentation for overnight routes
2. CODEBASE_MAP.md outdated (missing overnight, preview modules)
3. No runbook for overnight operations
4. Missing architecture decision records (ADRs)

---

## Flow Diagram

See `docs/FLOWS.mmd` for complete Mermaid diagram.

---

## Priority Ranking

**P0 (Immediate - Security Critical):**
1. B1 - Command injection fix
2. B2 - SQL injection (search)
3. B3 - SQL injection (date)
4. B4 - Scheduler race condition
5. B5 - Encrypt OAuth tokens
6. B6 - Access control on tags

**P1 (High - This Sprint):**
7. B7 - Token versions to Redis
8. B8 - CSRF protection
9. B9 - Email template injection
10. B10 - Idempotency keys
11. B11 - Atomic quota reservation
12. B12 - Path traversal validation
13. B13-B16 - N+1 query fixes + indexes

**P2 (Medium - Next Sprint):**
14-29. Performance optimizations, error handling, validation improvements

**P3 (Low - Backlog):**
30-42. Code quality, documentation, refactoring

---

## Update: 2026-01-31 Incremental Audit

### New Bug Found

#### B-NEW-01: TypeScript Compilation Error (CRITICAL - BLOCKING)
**Location:** `src/themes/theme-generator.ts:474`
**Severity:** Critical (blocks build/CI)
**Issue:** Property `heading` does not exist on type `Section`
**Reproduction:** Run `npm run typecheck`
**Root Cause:** The `Section` interface in `dom-extractor.ts` defines properties `tag`, `id`, `className`, `text`, `children` but no `heading` property.
**Fix:**
```diff
- const serviceTitle = section.heading || section.text?.split('.')[0] || `Service ${index + 1}`;
+ const serviceTitle = section.text?.split('.')[0] || `Service ${index + 1}`;
```

### Verification Notes

1. **Tests passing:** All 9 tests in 4 suites pass (ai.test.ts, api.test.ts, capture.test.ts, email.test.ts)
2. **TypeScript errors:** 1 error in `theme-generator.ts:474` (documented above)
3. **Previous critical security issues still require patching:**
   - S-01: Command injection in `deploy.ts` (use `execFileSync`)
   - S-02: SQL injection in `lead-model.ts` (now mitigated with `sanitizeSearchTerm`)
   - S-03: Race condition in scheduler (needs mutex)

### Positive Security Findings

The codebase includes several solid security practices:
- **PII Redaction:** Logger at `src/utils/logger.ts:7-46` automatically redacts emails, phone numbers, credit cards, SSNs, API keys, JWT tokens from logs
- **Rate Limiting:** Comprehensive rate limiting with Redis support at `src/utils/rate-limiter.ts`
- **Security Headers:** Helmet middleware with CSP, HSTS, frame protection at `src/utils/security-headers.ts`
- **Input Validation:** Zod schemas for request validation at `src/utils/validation.ts`
- **Search Sanitization:** `sanitizeSearchTerm()` in `lead-model.ts:7-14` mitigates PostgREST injection
- **XSS Protection:** `escapeHtml()` function in `unsubscribe.ts:34-46` for user-rendered content

### Architecture Observations

The sequence-engine.ts demonstrates good N+1 prevention with batch fetching:
```typescript
// Lines 247-270: Batch fetch all sequences and leads
const [sequencesResult, leadsResult] = await Promise.all([
  this.supabase.from('email_sequences').select('*').in('id', sequenceIds),
  this.supabase.from('leads').select('*').in('id', leadIds)
]);
```

However, `handleEmailEvent()` at lines 452-467 still processes enrollments sequentially and should be batched.
