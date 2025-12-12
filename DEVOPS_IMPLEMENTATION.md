# DevOps Implementation Guide

Complete documentation of the DevOps practices implemented for the CUET Fest 2025 Hackathon project.

---

## Table of Contents

1. [Overview](#overview)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Docker Configuration](#docker-configuration)
4. [GitHub Actions Workflows](#github-actions-workflows)
5. [Code Quality Tools](#code-quality-tools)
6. [Security Scanning](#security-scanning)
7. [Semantic Versioning](#semantic-versioning)
8. [VM Deployment](#vm-deployment)
9. [Project Structure](#project-structure)

---

## Overview

This project implements enterprise-grade DevOps practices based on the `devops-template.md` guide. The implementation covers:

| Stage            | Status | Description                                     |
| ---------------- | ------ | ----------------------------------------------- |
| Git Setup        | ✅     | .gitignore, .gitattributes, CODEOWNERS          |
| Code Quality     | ✅     | ESLint, Prettier, Husky, Commitlint             |
| Docker           | ✅     | Multi-stage builds, non-root user, healthchecks |
| CI Pipeline      | ✅     | Lint, Test, Build, Security scan                |
| CD Pipeline      | ✅     | Docker Hub + SSH deploy to VM                   |
| Semantic Release | ✅     | Auto-versioning and CHANGELOG                   |

---

## CI/CD Pipeline

### Architecture

```
Push to main
     │
     ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Lint     │ ──▶ │      Test       │ ──▶ │  Security Scan  │
│  (ESLint)   │     │  (E2E Tests)    │     │    (Trivy)      │
└─────────────┘     └─────────────────┘     └─────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Build & Push to       │
              │   Docker Hub            │
              └─────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   SSH Deploy to VM      │
              │   Pull → Restart        │
              └─────────────────────────┘
```

### Workflows

| Workflow       | Trigger      | Purpose                     |
| -------------- | ------------ | --------------------------- |
| `ci.yml`       | Push/PR      | Lint, Test, Build, Security |
| `cd.yml`       | Push to main | Deploy to VM via SSH        |
| `release.yml`  | Push to main | Semantic versioning         |
| `codeql.yml`   | Weekly/Push  | Code security analysis      |
| `security.yml` | Daily/Push   | npm audit + Trivy           |

---

## Docker Configuration

### Files

| File                          | Purpose                            |
| ----------------------------- | ---------------------------------- |
| `docker/Dockerfile.dev`       | Development with hot-reload        |
| `docker/Dockerfile.prod`      | Multi-stage production build       |
| `docker/compose.dev.yml`      | Local development                  |
| `docker/compose.prod.yml`     | Production (builds locally)        |
| `docker/compose.registry.yml` | Production (pulls from Docker Hub) |

### Production Dockerfile Features

- ✅ Multi-stage build (smaller image)
- ✅ Non-root user (`USER node`)
- ✅ Tini for signal handling
- ✅ Healthcheck configured
- ✅ Production dependencies only

### Docker Commands

```bash
# Development
make dev

# Production (local build)
make prod

# Production (Docker Hub)
docker compose -f docker/compose.registry.yml up -d
```

---

## GitHub Actions Workflows

### Required Secrets

| Secret               | Description             |
| -------------------- | ----------------------- |
| `DOCKERHUB_USERNAME` | Docker Hub username     |
| `DOCKERHUB_TOKEN`    | Docker Hub access token |
| `VM_HOST`            | VM IP address           |
| `VM_USER`            | SSH username            |
| `VM_SSH_KEY`         | Private SSH key         |

### CI Features

- **Concurrency control**: Cancels old runs on new push
- **Path filtering**: Skips CI for docs-only changes
- **Caching**: npm + Docker layer caching
- **Security**: Trivy vulnerability scanning
- **Immutable tags**: `sha-<commit>` tags

---

## Code Quality Tools

### ESLint + Prettier

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format all files
npm run format:check # Check formatting
```

### Husky + lint-staged

Pre-commit hooks automatically run on staged files:

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### Commitlint

Enforces conventional commit format:

```bash
# Valid commits
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login timeout"
git commit -m "docs: update API documentation"

# Invalid commits (rejected)
git commit -m "added feature"  # No type prefix
```

---

## Security Scanning

### Automated Scans

| Tool       | Frequency  | Target                     |
| ---------- | ---------- | -------------------------- |
| npm audit  | Every push | Dependencies               |
| Trivy      | Every push | Docker images + filesystem |
| CodeQL     | Weekly     | Source code                |
| Dependabot | Weekly     | Dependency updates         |

### Manual Commands

```bash
npm run security:audit    # Check vulnerabilities
npm run security:check    # Full check
npm run security:fix      # Auto-fix issues
```

---

## Semantic Versioning

Automatic versioning based on conventional commits:

| Commit Type | Version Bump          | Example       |
| ----------- | --------------------- | ------------- |
| `feat:`     | Minor (1.0.0 → 1.1.0) | New feature   |
| `fix:`      | Patch (1.0.0 → 1.0.1) | Bug fix       |
| `docs:`     | No release            | Documentation |
| `chore:`    | No release            | Maintenance   |

### Generated Files

- `CHANGELOG.md` - Auto-generated changelog
- `package.json` - Version updated
- GitHub Release - Created with notes

---

## VM Deployment

### Initial Setup

```bash
# On VM
cd /opt/hackathon
git clone <repo> .
cp .env.example .env
# Edit .env with production values
```

### Automated Deployment (CD)

When you push to `main`:

1. GitHub Actions builds image
2. Pushes to Docker Hub (`x08a8/delineate-hackathon`)
3. SSHs to VM
4. Runs:
   ```bash
   sudo git pull origin main
   sudo docker compose -f docker/compose.registry.yml pull
   sudo docker compose -f docker/compose.registry.yml up -d
   ```
5. Verifies health check

### Manual Deployment

```bash
cd /opt/hackathon
sudo docker compose -f docker/compose.registry.yml pull
sudo docker compose -f docker/compose.registry.yml up -d
curl http://localhost:3000/health
```

### Rollback

```bash
export IMAGE_TAG=<previous-sha>
sudo docker compose -f docker/compose.registry.yml pull
sudo docker compose -f docker/compose.registry.yml up -d
```

---

## Project Structure

```
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # CI pipeline
│   │   ├── cd.yml           # CD pipeline
│   │   ├── release.yml      # Semantic release
│   │   ├── codeql.yml       # Code security
│   │   └── security.yml     # Security scans
│   ├── dependabot.yml       # Auto-updates
│   ├── CODEOWNERS           # Review rules
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
├── .husky/
│   ├── pre-commit           # lint-staged
│   └── commit-msg           # commitlint
├── docker/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── compose.dev.yml
│   ├── compose.prod.yml
│   └── compose.registry.yml
├── src/                     # Backend source
├── frontend/                # React frontend
├── Makefile                 # DevOps commands
├── .editorconfig
├── .gitattributes
├── .releaserc.json
├── commitlint.config.mjs
└── package.json
```

---

## Quick Reference

### Makefile Commands

```bash
make help       # Show all commands
make dev        # Start development
make prod       # Start production
make test       # Run tests
make lint       # Run linting
make clean      # Cleanup
```

### npm Scripts

```bash
npm run dev           # Start dev server
npm run lint          # Check linting
npm run format        # Format code
npm run test:e2e      # Run E2E tests
npm run security:audit # Security check
```

---

## Best Practices Checklist

- [x] Multi-stage Docker builds
- [x] Non-root container user
- [x] Docker healthchecks
- [x] CI/CD with caching
- [x] Security scanning (Trivy, CodeQL)
- [x] Semantic versioning
- [x] Conventional commits
- [x] Pre-commit hooks
- [x] Dependency auto-updates
- [x] GitHub templates
- [x] CODEOWNERS
- [x] Concurrency control
- [x] Path-based CI filtering
