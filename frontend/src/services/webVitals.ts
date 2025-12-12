/**
 * Web Vitals Monitoring Service
 * 
 * Tracks Core Web Vitals (CLS, FID, LCP) and other important metrics (FCP, TTFB)
 * and sends them to both Sentry and OpenTelemetry for comprehensive monitoring.
 * 
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): Should be < 2.5s
 * - FID (First Input Delay): Should be < 100ms
 * - CLS (Cumulative Layout Shift): Should be < 0.1
 * 
 * Other Metrics:
 * - FCP (First Contentful Paint): Should be < 1.8s
 * - TTFB (Time to First Byte): Should be < 800ms
 * - INP (Interaction to Next Paint): Should be < 200ms
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { createSpan } from './telemetry';

/**
 * Rating thresholds for Web Vitals
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Determine the rating of a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to Sentry as a measurement
 */
function sendToSentry(metric: Metric) {
  const { name, value, rating, delta, id } = metric;
  
  // Send as Sentry measurement
  Sentry.getCurrentScope().setMeasurement(name, value, 'millisecond');
  
  // Add breadcrumb for tracking
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${name}: ${value.toFixed(2)}`,
    level: rating === 'good' ? 'info' : rating === 'needs-improvement' ? 'warning' : 'error',
    data: {
      value,
      delta,
      rating,
      id,
    },
  });
  
  // If metric is poor, send as a warning event
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${name} performance: ${value.toFixed(2)}ms`, {
      level: 'warning',
      tags: {
        metric: name,
        rating,
      },
      contexts: {
        'web-vitals': {
          value,
          delta,
          id,
        },
      },
    });
  }
}

/**
 * Send metric to OpenTelemetry as a custom span
 */
function sendToOpenTelemetry(metric: Metric) {
  const { name, value, rating, delta, id } = metric;
  
  createSpan(`web-vitals.${name}`, async (span) => {
    span.setAttributes({
      'web_vitals.name': name,
      'web_vitals.value': value,
      'web_vitals.delta': delta,
      'web_vitals.rating': rating,
      'web_vitals.id': id,
      'web_vitals.threshold_good': THRESHOLDS[name as keyof typeof THRESHOLDS]?.good || 0,
      'web_vitals.threshold_poor': THRESHOLDS[name as keyof typeof THRESHOLDS]?.poor || 0,
    });
    
    // Add event for the metric
    span.addEvent(`${name} measured`, {
      value,
      rating,
    });
  });
}

/**
 * Handle a Web Vital metric
 */
function handleMetric(metric: Metric) {
  const calculatedRating = getRating(metric.name, metric.value);
  const metricWithRating = { ...metric, rating: calculatedRating };
  
  console.log(
    `[Web Vitals] ${metric.name}:`,
    `${metric.value.toFixed(2)}ms`,
    `(${calculatedRating})`,
    metric
  );
  
  // Send to both monitoring systems
  sendToSentry(metricWithRating);
  sendToOpenTelemetry(metricWithRating);
}

/**
 * Initialize Web Vitals monitoring
 * 
 * This should be called once when the application starts.
 * It will automatically track all Core Web Vitals and report them
 * to both Sentry and OpenTelemetry.
 */
export function initWebVitals() {
  try {
    // Track Core Web Vitals
    onCLS(handleMetric); // Cumulative Layout Shift
    onFID(handleMetric); // First Input Delay
    onLCP(handleMetric); // Largest Contentful Paint
    
    // Track additional metrics
    onFCP(handleMetric); // First Contentful Paint
    onTTFB(handleMetric); // Time to First Byte
    onINP(handleMetric); // Interaction to Next Paint
    
    console.log('[Web Vitals] Monitoring initialized');
  } catch (error) {
    console.error('[Web Vitals] Failed to initialize:', error);
    Sentry.captureException(error);
  }
}

/**
 * Get current Web Vitals thresholds
 */
export function getWebVitalsThresholds() {
  return THRESHOLDS;
}

/**
 * Export the rating function for use in other components
 */
export { getRating };
