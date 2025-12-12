#!/bin/bash
# Docker entrypoint script for runtime environment variable injection
# This allows configuration changes without rebuilding the image

set -e

echo "=========================================="
echo "Frontend Container Starting..."
echo "=========================================="

# Default values if not provided
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:3000/api}"
export VITE_SENTRY_DSN="${VITE_SENTRY_DSN:-}"
export VITE_SENTRY_ENVIRONMENT="${VITE_SENTRY_ENVIRONMENT:-production}"
export VITE_SENTRY_TRACES_SAMPLE_RATE="${VITE_SENTRY_TRACES_SAMPLE_RATE:-0.1}"
export VITE_OTEL_ENDPOINT="${VITE_OTEL_ENDPOINT:-http://localhost:4318/v1/traces}"
export VITE_OTEL_SERVICE_NAME="${VITE_OTEL_SERVICE_NAME:-download-service-ui}"
export VITE_JAEGER_UI_URL="${VITE_JAEGER_UI_URL:-http://localhost:16686}"
export VITE_APP_VERSION="${VITE_APP_VERSION:-1.0.0}"

echo "Environment Configuration:"
echo "  API_BASE_URL: ${VITE_API_BASE_URL}"
echo "  SENTRY_DSN: ${VITE_SENTRY_DSN:0:20}..." # Show only first 20 chars
echo "  SENTRY_ENVIRONMENT: ${VITE_SENTRY_ENVIRONMENT}"
echo "  OTEL_ENDPOINT: ${VITE_OTEL_ENDPOINT}"
echo "  OTEL_SERVICE_NAME: ${VITE_OTEL_SERVICE_NAME}"
echo "  JAEGER_UI_URL: ${VITE_JAEGER_UI_URL}"
echo "  APP_VERSION: ${VITE_APP_VERSION}"
echo "=========================================="

# Generate runtime config file from template
echo "Generating runtime configuration..."
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

# Inject config script into index.html (before closing head tag)
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "Injecting runtime config into index.html..."
    
    # Check if config.js is already injected
    if ! grep -q "config.js" /usr/share/nginx/html/index.html; then
        sed -i 's|</head>|  <script src="/config.js"></script>\n  </head>|' /usr/share/nginx/html/index.html
        echo "✓ Config script injected successfully"
    else
        echo "✓ Config script already present"
    fi
fi

# Verify nginx configuration
echo "Verifying Nginx configuration..."
nginx -t

echo "=========================================="
echo "Frontend container ready!"
echo "Nginx will start on port 80"
echo "=========================================="

# Execute the main command (nginx)
exec "$@"
