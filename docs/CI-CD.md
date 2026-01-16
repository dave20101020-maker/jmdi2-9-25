# CI/CD Pipeline Guide

Complete guide to Project's automated testing and deployment pipelines using GitHub Actions.

## Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Frontend Pipeline](#frontend-pipeline)
- [Backend Pipeline](#backend-pipeline)
- [Deployment Pipeline](#deployment-pipeline)
- [Secrets & Configuration](#secrets--configuration)
- [Troubleshooting](#troubleshooting)

---

## Pipeline Overview

Project uses GitHub Actions with 3 main workflows:

```
Push/PR to main/develop
        ↓
    ├─ Frontend Tests
    │  ├─ Lint code
    │  ├─ Unit tests
    │  ├─ Build verification
    │  └─ Coverage report
    │
    ├─ Backend Tests
    │  ├─ Lint code
    │  ├─ Unit tests
    │  ├─ Integration tests
    │  ├─ AI endpoint tests
    │  ├─ Security audit
    │  └─ Stress tests
    │
    └─ Status checks
       ├─ All tests pass?
       ├─ Build successful?
       └─ Coverage acceptable?

Merge to main
    ↓
Deployment Pipeline
    ├─ Build Docker image
    ├─ Deploy to staging
    ├─ Run smoke tests
    └─ Deploy to production
```

### Workflow Files

All workflows are in `.github/workflows/`:

- **`frontend-tests.yml`** - Frontend linting, testing, building
- **`backend-tests.yml`** - Backend testing, security, stress tests
- **`deploy.yml`** - Docker build, deployment, rollback

---

## Frontend Pipeline

### Triggers

Runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only if `src/`, `package.json`, or `vite.config.js` changed

### Jobs

#### 1. Unit Tests

```yaml
Runs on: Ubuntu latest
Node versions: 18.x, 20.x
Duration: ~3 minutes
```

**Steps:**

1. Checkout code
2. Setup Node.js (with npm cache)
3. Install dependencies
4. Run ESLint (`npm run lint`)
5. Run unit tests (`npm run test`)
6. Build verification (`npm run build`)
7. Upload coverage to Codecov

#### 2. Accessibility Audit

```yaml
Runs on: Ubuntu latest
Duration: ~2 minutes
Tool: axe-core CLI
```

Scans built application for WCAG 2.1 AA issues.

#### 3. Type Checking

```yaml
Optional JSDoc type checking
Validates type consistency
```

### Success Criteria

All jobs must pass:

- ✅ Linting: 0 errors
- ✅ Tests: All pass
- ✅ Build: Successfully compiles to dist/
- ✅ Accessibility: No critical issues

### Artifacts

Successful builds generate:

- `dist-18.x/` - Production build
- `dist-20.x/` - Production build (alternate Node version)
- Coverage reports to Codecov

### Example Run

```bash
# Trigger workflow locally (using act)
act push -j test

# View results in GitHub
# Actions tab → frontend-tests → View run
```

---

## Backend Pipeline

### Triggers

Runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only if `backend/` or workflow file changed

### Jobs

#### 1. Unit Tests

```yaml
Node versions: 18.x, 20.x
Database: MongoDB 7 (containerized)
Duration: ~4 minutes
```

**Steps:**

1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run Jest tests with coverage
6. Upload coverage reports

**Environment Variables:**

```
MONGODB_URI: mongodb://localhost:27017/northstar-test
NODE_ENV: test
JWT_SECRET: test-secret-key
```

#### 2. Integration Tests

```yaml
Database: MongoDB 7
Duration: ~3 minutes
```

Tests database operations, API endpoints, workflows:

- User creation and authentication
- Habit CRUD operations
- Entry logging
- Pillar calculations

#### 3. AI Endpoint Tests

```yaml
Duration: ~2 minutes (or skip if no API keys)
```

Tests AI coach, insights, meditation endpoints with mocked responses.

**Requires secrets (at least one provider key):**

- `GEMINI_API_KEY` (Gemini-first)
- `OPENAI_API_KEY` (fallback)
  _Other provider keys (for example `ANTHROPIC_API_KEY`) are also honored if configured._

#### 4. Security Audit

```yaml
Duration: ~2 minutes
Tools: npm audit, Trivy scanner
```

Scans for:

- Vulnerable npm packages
- Critical security issues
- Dependency vulnerabilities

#### 5. Stress Tests

```yaml
Tool: k6
VUs: 5 (limited in CI)
Duration: 30 seconds
```

Runs basic AI endpoint stress test with low concurrency.

### Success Criteria

- ✅ Unit tests: 100% pass
- ✅ Integration tests: 100% pass
- ✅ No critical security issues
- ✅ Error rate < 10% (stress test)

---

## Deployment Pipeline

### Triggers

Manual workflow dispatch:

- Input: Environment (staging/production)

OR automatic on:

- Merge to `main` branch

### Jobs

#### 1. Build

```yaml
Tool: Docker Buildx
Registry: GitHub Container Registry (GHCR)
Duration: ~5 minutes
```

**Steps:**

1. Checkout code
2. Setup Docker Buildx
3. Login to GHCR
4. Extract image metadata
5. Build and push Docker image

**Image Tags:**

```
ghcr.io/dave20101020-maker/northstar-beta:main
ghcr.io/dave20101020-maker/northstar-beta:sha-abc123
ghcr.io/dave20101020-maker/northstar-beta:latest
```

#### 2. Test Build

```yaml
Duration: ~5 minutes
```

Runs lint, tests, and build on built image to ensure integrity.

#### 3. Deploy to Staging

```yaml
Platform: Fly.io
App: northstar-staging
Duration: ~3 minutes
Automatic on main branch
```

**Steps:**

1. Deploy to staging app
2. Health check (5 attempts, 10s between)
3. Notify Slack

#### 4. Deploy to Production

```yaml
Platform: Fly.io
App: northstar
Duration: ~3 minutes
Manual trigger only
```

**Steps:**

1. Create GitHub deployment record
2. Deploy to production
3. Run health checks
4. Run smoke tests
5. Update deployment status
6. Notify Slack on success/failure

#### 5. Rollback

```yaml
Automatic on deployment failure
```

Reverts to previous production release.

### Environment Secrets

Required secrets in GitHub Settings > Secrets:

```
FLY_API_TOKEN         # Fly.io deployment token
SLACK_WEBHOOK         # Slack notification webhook
GEMINI_API_KEY        # Optional: AI tests (Gemini-first)
OPENAI_API_KEY        # Optional: AI tests (fallback)
GITHUB_TOKEN          # Auto-provided by GitHub
```

### Deployment Process

```
1. Developer pushes to main
   ↓
2. All tests pass ✅
   ↓
3. Docker image built & pushed
   ↓
4. Deploy to staging automatically
   ↓
5. Manual approval to production
   ↓
6. Deploy to production
   ↓
7. Smoke tests pass ✅
   ↓
8. Success notification to Slack
```

---

## Secrets & Configuration

### Setting Up Secrets

1. Navigate to GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

```
Name: FLY_API_TOKEN
Value: <your-fly-token>

Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/...

Name: GEMINI_API_KEY
Value: <your-gemini-key>

Name: OPENAI_API_KEY
Value: sk-...
```

### Environment Configuration

#### Staging Environment

Automatic deployment on main branch merge.

```yaml
App: northstar-staging
URL: https://staging.northstar.app
Database: MongoDB Atlas (staging)
```

#### Production Environment

Manual deployment trigger with approval.

```yaml
App: northstar
URL: https://northstar.app
Database: MongoDB Atlas (production)
```

### Fly.io Configuration

Create `fly.toml` in repository root:

```toml
app = "northstar"
primary_region = "lax"

[[services]]
internal_port = 5000
protocol = "tcp"

[build]
image = "ghcr.io/dave20101020-maker/northstar-beta:latest"

[env]
NODE_ENV = "production"
LOG_LEVEL = "info"

[[env.production.env]]
LOG_LEVEL = "warn"

[[services]]
protocol = "http"
internal_port = 5000
ports = [{ handlers = ["http"], port = 80 }, { handlers = ["tls", "http"], port = 443 }]
```

---

## Monitoring & Debugging

### View Workflow Runs

**In GitHub UI:**

1. Navigate to repo
2. Actions tab
3. Select workflow
4. View run

**Via GitHub CLI:**

```bash
# List recent runs
gh run list --workflow=frontend-tests.yml

# View specific run
gh run view 12345

# Watch run in real-time
gh run watch 12345

# View job logs
gh run view 12345 --log-failed

# Download run artifacts
gh run download 12345
```

### Common Issues

**Tests failing in CI but passing locally:**

```bash
# Run in CI-like environment
CI=true npm test

# Check for environment-specific issues
# - File paths (Windows vs Unix)
# - Line endings
# - Timezone-dependent code
```

**Deployment stuck or timeout:**

```bash
# Check Fly.io logs
flyctl logs --app northstar

# Force redeploy
flyctl deploy --app northstar --force
```

**Slack notifications not sending:**

```bash
# Verify webhook URL
# Settings > Secrets > SLACK_WEBHOOK

# Test webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"test"}' \
  <SLACK_WEBHOOK>
```

---

## Optimization Tips

### Reduce Build Time

1. **Cache npm dependencies**

   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: "npm"
   ```

2. **Parallelize jobs**

   ```yaml
   jobs:
     test:
     build:
     deploy:
       needs: [test, build]
   ```

3. **Matrix strategy** (run same job with different versions)
   ```yaml
   strategy:
     matrix:
       node-version: [18.x, 20.x]
   ```

### Reduce Storage

1. Delete old artifacts

   ```yaml
   retention-days: 5
   ```

2. Only upload essential artifacts
   ```yaml
   - uses: actions/upload-artifact@v3
     with:
       name: coverage
       path: coverage/
   ```

### Cost Optimization

- Use self-hosted runners for long tests
- Parallelize expensive operations
- Cache Docker images
- Limit concurrent jobs

---

## Best Practices

1. **Keep workflows simple** - Complex workflows are hard to debug
2. **Use matrix builds** - Test multiple Node versions
3. **Fail fast** - Run quick tests first (linting before unit tests)
4. **Pin dependencies** - Use exact versions for reproducibility
5. **Secrets management** - Never commit secrets, use GitHub Secrets
6. **Notifications** - Slack/email for deployment events
7. **Documentation** - Document setup in comments
8. **Testing** - Test locally with `act` before pushing
9. **Monitoring** - Check workflow runs regularly
10. **Automation** - Automate as much as possible

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Fly.io Deploy Docs](https://fly.io/docs/getting-started/deploy/)
- [act - Local CI Testing](https://github.com/nektos/act)
