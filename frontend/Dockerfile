# Multi-stage Dockerfile for React Frontend
# Stage 1: Build the application
# Stage 2: Serve with Nginx

# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean install for reproducible builds
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ARG VITE_SENTRY_TRACES_SAMPLE_RATE
ARG VITE_OTEL_ENDPOINT
ARG VITE_OTEL_SERVICE_NAME
ARG VITE_JAEGER_UI_URL
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3000/api}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT:-production}
ENV VITE_SENTRY_TRACES_SAMPLE_RATE=${VITE_SENTRY_TRACES_SAMPLE_RATE:-0.1}
ENV VITE_OTEL_ENDPOINT=${VITE_OTEL_ENDPOINT:-http://localhost:4318/v1/traces}
ENV VITE_OTEL_SERVICE_NAME=${VITE_OTEL_SERVICE_NAME:-download-service-ui}
ENV VITE_JAEGER_UI_URL=${VITE_JAEGER_UI_URL:-http://localhost:16686}
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}

# Build the application for production
RUN npm run build

# ============================================
# Stage 2: Production Stage with Nginx
# ============================================
FROM nginx:1.25-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    gettext

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment variable injection script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create template for runtime env injection
RUN echo 'window.__RUNTIME_CONFIG__ = {' > /usr/share/nginx/html/config.js.template && \
    echo '  API_BASE_URL: "${VITE_API_BASE_URL}",' >> /usr/share/nginx/html/config.js.template && \
    echo '  SENTRY_DSN: "${VITE_SENTRY_DSN}",' >> /usr/share/nginx/html/config.js.template && \
    echo '  SENTRY_ENVIRONMENT: "${VITE_SENTRY_ENVIRONMENT}",' >> /usr/share/nginx/html/config.js.template && \
    echo '  OTEL_ENDPOINT: "${VITE_OTEL_ENDPOINT}",' >> /usr/share/nginx/html/config.js.template && \
    echo '  JAEGER_UI_URL: "${VITE_JAEGER_UI_URL}",' >> /usr/share/nginx/html/config.js.template && \
    echo '  APP_VERSION: "${VITE_APP_VERSION}"' >> /usr/share/nginx/html/config.js.template && \
    echo '};' >> /usr/share/nginx/html/config.js.template

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port 80
EXPOSE 80

# Use custom entrypoint for runtime env injection
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
