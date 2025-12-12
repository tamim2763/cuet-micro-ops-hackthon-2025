# Docker Infrastructure Guide

Complete guide for running the Delineate Download Service with Docker.

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │  │   Jaeger     │     │
│  │   (Nginx)    │─▶│   (Node.js)  │─▶│   Tracing    │     │
│  │   Port 80    │  │   Port 3000  │  │   Port 16686 │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                                │
│         │                  ▼                                │
│         │          ┌──────────────┐                         │
│         │          │    MinIO     │                         │
│         └─────────▶│   Storage    │                         │
│           (API)    │   Port 9000  │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Development Mode

```bash
# Start all services
make dev

# Start in detached mode
make dev-detach

# Rebuild and start
make dev-build
```

**Access Points:**

- Frontend: http://localhost:5173 (Vite dev server with hot reload)
- Backend API: http://localhost:3000
- Jaeger UI: http://localhost:16686
- MinIO Console: http://localhost:9001

### Production Mode

```bash
# Build and start production stack
make prod-build

# Start production
make prod
```

**Access Points:**

- Frontend: http://localhost:80 (Nginx production build)
- Backend API: http://localhost:3000
- Jaeger UI: http://localhost:16686

## 📋 Services

### Frontend (React + Vite)

**Development:**

- Image: `node:20-alpine`
- Hot module replacement enabled
- Source files mounted as volumes
- Port: 5173

**Production:**

- Multi-stage build (Node builder + Nginx server)
- Optimized production build
- Gzip compression enabled
- Security headers configured
- Runtime environment variable injection
- Port: 80

### Backend (Node.js + Hono)

- Image: Custom (Dockerfile.dev / Dockerfile.prod)
- OpenTelemetry instrumentation
- S3-compatible storage (MinIO)
- Health checks enabled
- Port: 3000

### Jaeger (Distributed Tracing)

- Image: `jaegertracing/all-in-one:latest`
- OTLP collector enabled
- Memory storage (development)
- UI Port: 16686
- OTLP Port: 4318 (mapped to 14318 externally)

### MinIO (Object Storage)

- Image: `minio/minio:latest`
- S3-compatible API
- Auto-initialized bucket: `downloads`
- Storage Port: 9000
- Console Port: 9001

## 🛠️ Makefile Commands

### Development

```bash
make dev              # Start full stack
make dev-build        # Rebuild and start
make dev-detach       # Start in background
make frontend         # Frontend only
make backend          # Backend only
```

### Production

```bash
make prod             # Start production
make prod-build       # Build and start
make prod-down        # Stop production
```

### Monitoring

```bash
make logs             # View all logs
make logs-app         # Backend logs only
make logs-frontend    # Frontend logs only
make status           # Show container status
make jaeger           # Open Jaeger UI
make minio            # Open MinIO console
```

### Cleanup

```bash
make clean            # Remove containers and volumes
make clean-all        # Full cleanup including images
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Backend
NODE_ENV=development
PORT=3000

# S3/MinIO
S3_REGION=us-east-1
S3_ENDPOINT=http://delineate-minio:9000
S3_ACCESS_KEY_ID=minio_admin
S3_SECRET_ACCESS_KEY=minio_secret_key_2025
S3_BUCKET_NAME=downloads
S3_FORCE_PATH_STYLE=true

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://delineate-jaeger:4318

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_OTEL_ENDPOINT=http://localhost:14318/v1/traces
VITE_OTEL_SERVICE_NAME=download-service-ui
VITE_JAEGER_UI_URL=http://localhost:16686
VITE_APP_VERSION=1.0.0
```

### Docker Compose Files

**compose.dev.yml** - Development environment

- Hot reload for frontend and backend
- Source files mounted as volumes
- All ports exposed for debugging
- Verbose logging

**compose.prod.yml** - Production environment

- Optimized builds
- No source mounts
- Resource limits configured
- Security hardened
- Restart policies enabled

## 📦 Docker Images

### Frontend Image Layers

```dockerfile
Stage 1: Builder (node:20-alpine)
├── Install dependencies (npm ci)
├── Copy source files
├── Build production bundle (npm run build)
└── Output: /app/dist

Stage 2: Nginx (nginx:1.25-alpine)
├── Copy nginx configuration
├── Copy built files from Stage 1
├── Copy runtime entrypoint script
├── Configure health check
└── Final image: ~50MB
```

### Build Arguments

The frontend Dockerfile accepts these build arguments:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_SENTRY_DSN=your-dsn \
  --build-arg VITE_SENTRY_ENVIRONMENT=production \
  -t delineate-frontend:latest \
  -f frontend/Dockerfile \
  frontend/
```

## 🔒 Security Features

### Nginx Security Headers

```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configured]
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### CORS Configuration

API requests are proxied through Nginx with proper CORS headers:

- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Authorization, traceparent, tracestate, etc.
- Credentials: Supported

### Resource Limits (Production)

**Frontend:**

- CPU: 0.5 cores (limit), 0.25 cores (reserved)
- Memory: 512MB (limit), 256MB (reserved)

**Backend:**

- CPU: 1.0 cores (limit), 0.5 cores (reserved)
- Memory: 1GB (limit), 512MB (reserved)

## 🏥 Health Checks

All services include health checks:

**Frontend (Nginx):**

```yaml
healthcheck:
  test: curl -f http://localhost:80/health
  interval: 30s
  timeout: 10s
  retries: 3
```

**Backend:**

```yaml
healthcheck:
  test: curl -f http://localhost:3000/api/health
  interval: 30s
  timeout: 10s
  retries: 3
```

**Jaeger:**

```yaml
healthcheck:
  test: wget --spider -q http://localhost:16686/
  interval: 30s
  timeout: 10s
  retries: 3
```

## 🔍 Observability

### Distributed Tracing

All services send traces to Jaeger:

1. Frontend creates trace context (OpenTelemetry)
2. Trace ID propagated via `traceparent` header
3. Backend continues the same trace
4. View complete trace in Jaeger UI

**Access Jaeger:**

```bash
make jaeger
# or
open http://localhost:16686
```

### Trace Correlation

Frontend errors include trace IDs:

- Click "View in Jaeger" from error screen
- See complete distributed trace
- Correlate frontend errors with backend logs

## 📊 Monitoring

### Container Logs

```bash
# All logs
docker compose -f docker/compose.dev.yml logs -f

# Specific service
docker compose -f docker/compose.dev.yml logs -f delineate-frontend
docker compose -f docker/compose.dev.yml logs -f delineate-app

# Last 100 lines
docker compose -f docker/compose.dev.yml logs --tail=100
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats delineate-frontend
```

## 🐛 Troubleshooting

### Port Already in Use

**Problem:** Port 80 or 3000 already in use

**Solution:**

```bash
# Find process using port
netstat -ano | findstr :80

# Kill process
taskkill /PID <pid> /F

# Or change port in compose file
```

### Build Failures

**Problem:** npm install fails in Docker

**Solution:**

```bash
# Clear npm cache
docker compose -f docker/compose.dev.yml build --no-cache frontend

# Or manually:
docker system prune -a
make dev-build
```

### Network Issues

**Problem:** Services can't communicate

**Solution:**

```bash
# Recreate network
docker network rm delineate-network
docker network create delineate-network

# Restart services
make clean
make dev
```

### Volume Permission Issues

**Problem:** Permission denied in volumes (Linux)

**Solution:**

```bash
# Fix ownership
sudo chown -R $USER:$USER frontend/node_modules
sudo chown -R $USER:$USER node_modules
```

## 🚀 Deployment

### Build Production Images

```bash
# Build frontend
cd frontend
docker build -t delineate-frontend:1.0.0 -f Dockerfile .

# Build backend
docker build -t delineate-backend:1.0.0 -f docker/Dockerfile.prod .
```

### Push to Registry

```bash
# Tag images
docker tag delineate-frontend:1.0.0 your-registry/delineate-frontend:1.0.0
docker tag delineate-backend:1.0.0 your-registry/delineate-backend:1.0.0

# Push
docker push your-registry/delineate-frontend:1.0.0
docker push your-registry/delineate-backend:1.0.0
```

### Deploy to Production

```bash
# Pull images on server
docker pull your-registry/delineate-frontend:1.0.0
docker pull your-registry/delineate-backend:1.0.0

# Start production stack
make prod-build
```

## 📝 Development Workflow

### Typical Development Session

```bash
# 1. Start development stack
make dev-detach

# 2. Check status
make status

# 3. View logs
make logs

# 4. Open services
make jaeger
make minio

# 5. Make changes (hot reload automatically applies)

# 6. View specific service logs
make logs-frontend

# 7. Stop when done
make clean
```

### Frontend Development Only

```bash
# Start just frontend + Jaeger
make frontend

# Frontend runs on http://localhost:5173
# Auto-reloads on file changes
```

### Backend Development Only

```bash
# Start backend + dependencies
make backend

# Backend runs on http://localhost:3000
```

## 🔄 Runtime Configuration

Frontend supports runtime environment variable injection without rebuilding:

1. Update environment variables in docker-compose
2. Restart container: `docker compose restart delineate-frontend`
3. New config applied without rebuild

This is handled by the `docker-entrypoint.sh` script which generates `config.js` at startup.

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [MinIO Documentation](https://min.io/docs/)

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `make logs`
2. Verify status: `make status`
3. Try clean restart: `make clean && make dev`
4. Check environment variables in `.env`
5. Ensure all required ports are available

---

**Last Updated:** December 2025  
**Docker Version:** 24.0+  
**Docker Compose Version:** 2.20+
