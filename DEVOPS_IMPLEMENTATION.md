# DevOps & Security Implementation Guide

Complete documentation of all implementations for the CUET Fest 2025 Hackathon.

---

## 🏆 Hackathon Challenges Completed

| Challenge             | Status | Implementation                    |
| --------------------- | ------ | --------------------------------- |
| **1. S3 Storage**     | ✅     | MinIO in Docker, presigned URLs   |
| **2. Architecture**   | ✅     | Async polling with Redis + BullMQ |
| **3. CI/CD Pipeline** | ✅     | GitHub Actions → Docker Hub → VM  |
| **4. Observability**  | ✅     | React + Sentry + OpenTelemetry    |

### 🌐 Live Demo URLs

| Service         | URL                                                                     | Description                    |
| --------------- | ----------------------------------------------------------------------- | ------------------------------ |
| **Backend API** | http://36.255.71.63:3000                                                | Hono API with health endpoint  |
| **API Health**  | http://36.255.71.63:3000/health                                         | Returns `{"status":"healthy"}` |
| **API Docs**    | http://36.255.71.63:3000/docs                                           | Scalar OpenAPI documentation   |
| **Frontend**    | http://36.255.71.63:5173                                                | React Observability Dashboard  |
| **GitHub**      | [Repository](https://github.com/tamim2763/cuet-micro-ops-hackthon-2025) | Source code                    |

---

## Table of Contents

1. [Hackathon Challenges Completed](#-hackathon-challenges-completed)
2. [Backend Security Features](#backend-security-features)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Docker Configuration](#docker-configuration)
5. [Observability Stack](#observability-stack)
6. [Code Quality Tools](#code-quality-tools)
7. [VM Deployment](#vm-deployment)

---

## Backend Security Features

All security features are implemented in `src/index.ts`:

### 1. Request ID Tracking (Lines 80-85)

Every request gets a unique ID for distributed tracing:

```typescript
app.use(async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("x-request-id", requestId);
  await next();
});
```

### 2. Rate Limiting (Lines 109-119)

Configurable rate limiting with standard headers:

```typescript
app.use(
  rateLimiter({
    windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 60000ms
    limit: env.RATE_LIMIT_MAX_REQUESTS, // Default: 100
    standardHeaders: "draft-6",
  }),
);
```

### 3. Security Headers (Line 88)

HSTS, X-Frame-Options, X-Content-Type-Options via Hono middleware:

```typescript
app.use(secureHeaders());
```

Headers added:

- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-Download-Options: noopen`
- `X-XSS-Protection: 0`

### 4. CORS Configuration (Lines 91-103)

Configurable CORS via environment variable:

```typescript
app.use(
  cors({
    origin: env.CORS_ORIGINS, // "*" or comma-separated list
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  }),
);
```

### 5. Input Validation with Zod (Lines 178-253)

All inputs validated before processing:

```typescript
const DownloadCheckRequestSchema = z.object({
  file_id: z.number().int().min(10000).max(100000000),
});
```

### 6. Path Traversal Prevention (Lines 256-261)

S3 keys are sanitized to prevent path injection:

```typescript
const sanitizeS3Key = (fileId: number): string => {
  const sanitizedId = Math.floor(Math.abs(fileId));
  return `downloads/${String(sanitizedId)}.zip`; // No user-controlled paths
};
```

### 7. Graceful Shutdown (Lines 639-686)

Clean shutdown on SIGTERM/SIGINT:

```typescript
const gracefulShutdown = (server) => (signal) => {
  server.close(() => {
    otelSDK.shutdown(); // Flush traces
    s3Client.destroy(); // Close S3 connections
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

---

## CI/CD Pipeline

### Architecture

```
Push to main
     │
     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Lint     │───▶│    Test     │───▶│  Security   │
│   ESLint    │    │  29 E2E     │    │   Trivy     │
│  Prettier   │    │   tests     │    │   CodeQL    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Build & Push Docker  │
              │  x08a8/delineate-*    │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   SSH Deploy to VM    │
              │   Health Check        │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Semantic Release    │
              │   CHANGELOG + Tag     │
              └───────────────────────┘
```

### GitHub Actions Workflows

| Workflow         | Trigger       | Purpose                               |
| ---------------- | ------------- | ------------------------------------- |
| `ci.yml`         | Push/PR       | Lint, Test, Build, Security scan      |
| `cd.yml`         | Push to main  | SSH deploy to production VM           |
| `release.yml`    | Push to main  | Auto-versioning with semantic-release |
| `codeql.yml`     | Weekly + Push | Static security analysis              |
| `security.yml`   | Daily + Push  | npm audit + Trivy scan                |
| `auto-merge.yml` | Dependabot PR | Auto-merge safe updates               |

### Required GitHub Secrets

| Secret               | Purpose                 |
| -------------------- | ----------------------- |
| `DOCKERHUB_USERNAME` | Docker Hub login        |
| `DOCKERHUB_TOKEN`    | Docker Hub access token |
| `VM_HOST`            | Production VM IP        |
| `VM_USER`            | SSH username            |
| `VM_SSH_KEY`         | Private SSH key         |

---

## Docker Configuration

### Files

| File                          | Purpose                            |
| ----------------------------- | ---------------------------------- |
| `docker/Dockerfile.dev`       | Hot-reload development             |
| `docker/Dockerfile.prod`      | Multi-stage production             |
| `docker/compose.dev.yml`      | Local dev with MinIO + Jaeger      |
| `docker/compose.prod.yml`     | Production (builds locally)        |
| `docker/compose.registry.yml` | Production (pulls from Docker Hub) |

### Production Dockerfile Features

```dockerfile
# Multi-stage build
FROM node:24-slim AS builder
RUN npm install --omit=dev --ignore-scripts

FROM node:24-slim
# Non-root user
USER node
# Signal handling
ENTRYPOINT ["/sbin/tini", "--"]
# Healthcheck
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:3000/health
```

### Quick Commands

```bash
make dev      # Start development environment
make prod     # Start production environment
make test     # Run E2E tests
make clean    # Remove containers and volumes
```

---

## Observability Stack

### Challenge 4 Implementation

#### Backend (Hono API)

- **Sentry**: Error capture with `@hono/sentry`
- **OpenTelemetry**: Distributed tracing via `@hono/otel`
- **Jaeger**: Trace visualization on port 16686

#### Frontend (React Dashboard)

| Component     | File                     | Purpose               |
| ------------- | ------------------------ | --------------------- |
| Health Status | `HealthStatus.tsx`       | Real-time API health  |
| Download Jobs | `DownloadJobs.tsx`       | Job management        |
| Error Log     | `ErrorLog.tsx`           | Sentry errors display |
| Trace Viewer  | `TraceViewer.tsx`        | Jaeger integration    |
| Performance   | `PerformanceMetrics.tsx` | Response time charts  |

#### Sentry Integration (`frontend/src/services/sentry.ts`)

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
});
```

#### OpenTelemetry Integration (`frontend/src/services/telemetry.ts`)

```typescript
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [/.*/], // W3C trace context
    }),
  ],
});
```

#### Trace Correlation Flow

```
User Action → Frontend Span → traceparent header → Backend Span → Jaeger
     ↓              ↓                                    ↓
  Sentry         trace_id                            trace_id
```

---

## Code Quality Tools

### Pre-commit Hooks (Husky + lint-staged)

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### Commit Message Validation (Commitlint)

```bash
# ✅ Valid
git commit -m "feat: add download queue"
git commit -m "fix: resolve S3 timeout"

# ❌ Invalid
git commit -m "added feature"  # No type prefix
```

### Semantic Release

Auto-versioning based on commits:

| Commit   | Version Bump          |
| -------- | --------------------- |
| `feat:`  | Minor (1.0.0 → 1.1.0) |
| `fix:`   | Patch (1.0.0 → 1.0.1) |
| `feat!:` | Major (1.0.0 → 2.0.0) |

---

## VM Deployment

### Automated CD Flow

1. Push to `main` branch
2. CI runs (lint, test, security)
3. Docker image built → pushed to Docker Hub
4. SSH to VM:
   ```bash
   sudo git pull origin main
   sudo docker compose -f docker/compose.registry.yml pull
   sudo docker compose -f docker/compose.registry.yml up -d
   ```
5. Health check verification

### Manual Deployment

```bash
cd /opt/hackathon
sudo docker compose -f docker/compose.registry.yml pull
sudo docker compose -f docker/compose.registry.yml up -d
curl http://localhost:3000/health
```

### Rollback

```bash
export IMAGE_TAG=<previous-commit-sha>
sudo docker compose -f docker/compose.registry.yml pull
sudo docker compose -f docker/compose.registry.yml up -d
```

---

## Project Structure

```
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI pipeline
│   │   ├── cd.yml              # CD pipeline
│   │   ├── release.yml         # Semantic release
│   │   ├── security.yml        # Security scans
│   │   └── codeql.yml          # Code analysis
│   ├── dependabot.yml          # Auto-updates
│   └── CODEOWNERS
├── docker/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── compose.dev.yml
│   ├── compose.prod.yml
│   └── compose.registry.yml
├── frontend/
│   ├── src/
│   │   ├── components/         # Dashboard UI
│   │   ├── services/           # Sentry + OTEL
│   │   └── App.tsx
│   └── package.json
├── src/
│   └── index.ts                # Backend API (security features)
├── .husky/                     # Git hooks
├── Makefile                    # DevOps commands
├── commitlint.config.mjs
├── .releaserc.json
└── package.json
```

---

## Best Practices Checklist

### DevOps

- [x] Multi-stage Docker builds
- [x] Non-root container user
- [x] Docker healthchecks
- [x] CI/CD with caching
- [x] Semantic versioning
- [x] Conventional commits
- [x] Pre-commit hooks
- [x] Dependency auto-updates

### Security

- [x] Request ID tracking
- [x] Rate limiting
- [x] Security headers (HSTS, etc.)
- [x] CORS configuration
- [x] Input validation (Zod)
- [x] Path traversal prevention
- [x] Graceful shutdown
- [x] Trivy vulnerability scanning
- [x] CodeQL analysis
- [x] npm audit

### Observability

- [x] Sentry error tracking
- [x] OpenTelemetry tracing
- [x] Jaeger visualization
- [x] W3C Trace Context propagation
- [x] Frontend-backend trace correlation
