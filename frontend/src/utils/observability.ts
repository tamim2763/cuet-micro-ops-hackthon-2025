/**
 * Observability Utilities for Trace Correlation
 * 
 * Provides utilities for correlating frontend errors with backend traces,
 * generating links to Jaeger UI, and displaying trace information.
 */

import { getCurrentTraceId } from '../services/telemetry';

/**
 * Configuration for observability backend URLs
 */
const JAEGER_UI_URL = import.meta.env.VITE_JAEGER_UI_URL || 'http://localhost:16686';
const SENTRY_UI_URL = import.meta.env.VITE_SENTRY_UI_URL || 'https://sentry.io';

/**
 * Generate a link to view a trace in Jaeger UI
 * 
 * @param traceId - The OpenTelemetry trace ID (32 hex characters)
 * @returns URL to the trace in Jaeger UI
 * 
 * @example
 * const traceId = getCurrentTraceId();
 * const jaegerUrl = getJaegerTraceUrl(traceId);
 * window.open(jaegerUrl, '_blank');
 */
export function getJaegerTraceUrl(traceId: string | null | undefined): string | null {
  if (!traceId) return null;
  
  // Jaeger expects trace IDs in lowercase hex format
  const normalizedTraceId = traceId.toLowerCase().replace(/[^a-f0-9]/g, '');
  
  if (normalizedTraceId.length !== 32) {
    console.warn(`[Observability] Invalid trace ID format: ${traceId}`);
    return null;
  }
  
  return `${JAEGER_UI_URL}/trace/${normalizedTraceId}`;
}

/**
 * Generate a link to view an error in Sentry UI
 * 
 * @param eventId - The Sentry event ID
 * @param organizationSlug - Sentry organization slug
 * @param projectSlug - Sentry project slug
 * @returns URL to the error in Sentry UI
 * 
 * @example
 * const sentryUrl = getSentryErrorUrl(eventId, 'my-org', 'my-project');
 * window.open(sentryUrl, '_blank');
 */
export function getSentryErrorUrl(
  eventId: string | null | undefined,
  organizationSlug: string = 'your-org',
  projectSlug: string = 'download-service-ui'
): string | null {
  if (!eventId) return null;
  
  return `${SENTRY_UI_URL}/organizations/${organizationSlug}/issues/?query=${eventId}`;
}

/**
 * Format a trace ID for display (adds hyphens for readability)
 * 
 * @param traceId - The raw trace ID
 * @returns Formatted trace ID (e.g., "1234abcd-5678-efgh-9012-ijkl3456mnop")
 * 
 * @example
 * const formatted = formatTraceId("1234abcd5678efgh9012ijkl3456mnop");
 * // Returns: "1234abcd-5678-efgh-9012-ijkl3456mnop"
 */
export function formatTraceId(traceId: string | null | undefined): string {
  if (!traceId) return 'N/A';
  
  // Format: 8-4-4-4-12 (like UUID format for readability)
  if (traceId.length === 32) {
    return `${traceId.slice(0, 8)}-${traceId.slice(8, 12)}-${traceId.slice(12, 16)}-${traceId.slice(16, 20)}-${traceId.slice(20)}`;
  }
  
  return traceId;
}

/**
 * Copy trace ID to clipboard
 * 
 * @param traceId - The trace ID to copy
 * @returns Promise that resolves when copied successfully
 * 
 * @example
 * const traceId = getCurrentTraceId();
 * await copyTraceId(traceId);
 * alert('Trace ID copied!');
 */
export async function copyTraceId(traceId: string | null | undefined): Promise<boolean> {
  if (!traceId) return false;
  
  try {
    await navigator.clipboard.writeText(traceId);
    console.log('[Observability] Trace ID copied to clipboard:', traceId);
    return true;
  } catch (error) {
    console.error('[Observability] Failed to copy trace ID:', error);
    return false;
  }
}

/**
 * Open trace in Jaeger UI in a new window
 * 
 * @param traceId - The trace ID to view
 * @returns The opened window or null if failed
 * 
 * @example
 * const traceId = getCurrentTraceId();
 * openTraceInJaeger(traceId);
 */
export function openTraceInJaeger(traceId: string | null | undefined): Window | null {
  const url = getJaegerTraceUrl(traceId);
  
  if (!url) {
    console.error('[Observability] Cannot open Jaeger: invalid trace ID');
    return null;
  }
  
  console.log('[Observability] Opening trace in Jaeger:', url);
  return window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Get correlation data for an error
 * 
 * Collects all relevant context for error correlation including
 * trace ID, page information, user agent, and timestamp.
 * 
 * @returns Object containing correlation data
 * 
 * @example
 * const correlationData = getErrorCorrelationData();
 * logError(error, correlationData);
 */
export function getErrorCorrelationData() {
  const traceId = getCurrentTraceId();
  
  return {
    traceId: traceId || 'unknown',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    jaegerUrl: getJaegerTraceUrl(traceId),
  };
}

/**
 * Create a correlation ID that combines Sentry event ID and trace ID
 * 
 * @param sentryEventId - Sentry event ID
 * @param traceId - OpenTelemetry trace ID
 * @returns Combined correlation ID
 * 
 * @example
 * const correlationId = createCorrelationId(sentryEventId, traceId);
 * console.log('Correlation ID:', correlationId);
 */
export function createCorrelationId(
  sentryEventId: string | null | undefined,
  traceId: string | null | undefined
): string {
  const parts: string[] = [];
  
  if (sentryEventId) {
    parts.push(`sentry:${sentryEventId}`);
  }
  
  if (traceId) {
    parts.push(`trace:${traceId}`);
  }
  
  return parts.length > 0 ? parts.join('|') : 'unknown';
}

/**
 * Parse a correlation ID back into its components
 * 
 * @param correlationId - The correlation ID to parse
 * @returns Object with sentryEventId and traceId
 * 
 * @example
 * const { sentryEventId, traceId } = parseCorrelationId(correlationId);
 */
export function parseCorrelationId(correlationId: string): {
  sentryEventId: string | null;
  traceId: string | null;
} {
  const result = {
    sentryEventId: null as string | null,
    traceId: null as string | null,
  };
  
  const parts = correlationId.split('|');
  
  for (const part of parts) {
    if (part.startsWith('sentry:')) {
      result.sentryEventId = part.substring(7);
    } else if (part.startsWith('trace:')) {
      result.traceId = part.substring(6);
    }
  }
  
  return result;
}

/**
 * Check if trace ID is valid
 * 
 * @param traceId - The trace ID to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * if (isValidTraceId(traceId)) {
 *   // Use the trace ID
 * }
 */
export function isValidTraceId(traceId: string | null | undefined): boolean {
  if (!traceId) return false;
  
  // Remove hyphens and check if it's 32 hex characters
  const cleaned = traceId.replace(/-/g, '').toLowerCase();
  return /^[a-f0-9]{32}$/.test(cleaned);
}

/**
 * Get current observability context
 * 
 * Returns all current observability context including trace ID,
 * Jaeger URL, and correlation data.
 * 
 * @returns Current observability context
 * 
 * @example
 * const context = getObservabilityContext();
 * console.log('Current context:', context);
 */
export function getObservabilityContext() {
  const traceId = getCurrentTraceId();
  
  return {
    traceId,
    traceIdFormatted: formatTraceId(traceId),
    jaegerUrl: getJaegerTraceUrl(traceId),
    isValid: isValidTraceId(traceId),
    correlationData: getErrorCorrelationData(),
  };
}
