# Makefile for DevOps operations
# Usage: make <target>

.PHONY: help dev prod test lint format clean logs status frontend backend

# Default target
help:
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║           Delineate Hackathon - DevOps Commands              ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  Development                                                 ║"
	@echo "║    make dev          Start full stack (frontend + backend)   ║"
	@echo "║    make dev-build    Rebuild and start development           ║"
	@echo "║    make frontend     Start only frontend (dev mode)          ║"
	@echo "║    make backend      Start only backend                      ║"
	@echo "║    make logs         View all container logs                 ║"
	@echo "║    make status       Show container status                   ║"
	@echo "║                                                              ║"
	@echo "║  Production                                                  ║"
	@echo "║    make prod         Start production environment            ║"
	@echo "║    make prod-build   Rebuild and start production            ║"
	@echo "║                                                              ║"
	@echo "║  Testing & Quality                                           ║"
	@echo "║    make test         Run E2E tests                           ║"
	@echo "║    make lint         Run ESLint                              ║"
	@echo "║    make format       Format code with Prettier               ║"
	@echo "║    make check        Run all checks (lint + format + test)   ║"
	@echo "║    make security     Run security audit                      ║"
	@echo "║                                                              ║"
	@echo "║  Observability                                               ║"
	@echo "║    make jaeger       Open Jaeger UI (localhost:16686)        ║"
	@echo "║    make minio        Open MinIO Console (localhost:9001)     ║"
	@echo "║                                                              ║"
	@echo "║  Cleanup                                                     ║"
	@echo "║    make clean        Stop and remove all containers/volumes  ║"
	@echo "║    make clean-all    Full cleanup including images           ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"

# Development
dev:
	@echo "🚀 Starting full development stack (Frontend + Backend)..."
	docker compose -f docker/compose.dev.yml up

dev-build:
	@echo "🔨 Rebuilding and starting development stack..."
	docker compose -f docker/compose.dev.yml up --build

dev-detach:
	@echo "🚀 Starting development stack in detached mode..."
	docker compose -f docker/compose.dev.yml up -d
	@echo "✅ Stack started! View logs with: make logs"
	@echo "📊 Frontend: http://localhost:5173"
	@echo "🔧 Backend API: http://localhost:3000"
	@echo "📈 Jaeger UI: http://localhost:16686"

frontend:
	@echo "🎨 Starting frontend only (dev mode with hot reload)..."
	docker compose -f docker/compose.dev.yml up delineate-frontend delineate-jaeger

backend:
	@echo "⚙️  Starting backend only..."
	docker compose -f docker/compose.dev.yml up delineate-app delineate-minio delineate-minio-init delineate-jaeger

# Production
prod:
	@echo "🚀 Starting production stack..."
	docker compose -f docker/compose.prod.yml up

prod-build:
	@echo "🔨 Building and starting production stack..."
	docker compose -f docker/compose.prod.yml up --build -d
	@echo "✅ Production stack started!"
	@echo "🌐 Frontend (Nginx): http://localhost:80"
	@echo "🔧 Backend API: http://localhost:3000"
	@echo "📈 Jaeger UI: http://localhost:16686"

prod-down:
	@echo "⏹️  Stopping production stack..."
	docker compose -f docker/compose.prod.yml down

# Testing & Quality
test:
	npm run test:e2e

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

check:
	npm run lint && npm run format:check && npm run test:e2e

security:
	npm run security:audit

# Logs & Status
logs:
	docker compose -f docker/compose.dev.yml logs -f

logs-app:
	docker compose -f docker/compose.dev.yml logs -f delineate-app

logs-frontend:
	docker compose -f docker/compose.dev.yml logs -f delineate-frontend

status:
	@echo "📊 Container Status:"
	@docker compose -f docker/compose.dev.yml ps
	@echo ""
	@echo "🌐 Service URLs:"
	@echo "  Frontend (Dev):  http://localhost:5173"
	@echo "  Backend API:     http://localhost:3000"
	@echo "  Jaeger UI:       http://localhost:16686"
	@echo "  MinIO Console:   http://localhost:9001"

# Observability
jaeger:
	@echo "🔍 Opening Jaeger UI..."
	@powershell -Command "Start-Process 'http://localhost:16686'"

minio:
	@echo "💾 Opening MinIO Console..."
	@echo "  Username: minio_admin"
	@echo "  Password: minio_secret_key_2025"
	@powershell -Command "Start-Process 'http://localhost:9001'"

# Cleanup
clean:
	@echo "🧹 Cleaning up development environment..."
	docker compose -f docker/compose.dev.yml down -v
	docker compose -f docker/compose.prod.yml down -v
	@echo "✅ Cleanup complete!"

clean-all:
	@echo "🧹 Full cleanup (including images)..."
	docker compose -f docker/compose.dev.yml down -v --rmi local
	docker compose -f docker/compose.prod.yml down -v --rmi local
	docker system prune -f
	@echo "✅ Full cleanup complete!"
