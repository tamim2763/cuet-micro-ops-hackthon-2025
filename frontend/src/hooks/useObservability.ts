/**
 * Custom Hooks for Observability and Instrumentation
 *
 * Provides React hooks for tracking user interactions, page views,
 * and custom events with both Sentry breadcrumbs and OpenTelemetry spans.
 */

import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { createSpan, getCurrentTraceId } from "../services/telemetry";

/**
 * Hook to track page views with both Sentry and OpenTelemetry
 *
 * Automatically tracks route changes and sends page view events.
 * Creates a span for each page view with timing information.
 *
 * @example
 * function MyComponent() {
 *   usePageTracking();
 *   return <div>...</div>;
 * }
 */
export function usePageTracking() {
  const location = useLocation();
  const prevLocation = useRef(location.pathname);

  useEffect(() => {
    const path = location.pathname;
    const search = location.search;
    const fullPath = `${path}${search}`;

    // Only track if location actually changed
    if (prevLocation.current === path) return;
    prevLocation.current = path;

    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: "navigation",
      message: `Navigated to ${fullPath}`,
      level: "info",
      data: {
        from: prevLocation.current,
        to: path,
        search,
      },
    });

    // Create OpenTelemetry span for page view
    createSpan(`page.view.${path}`, async (span) => {
      span.setAttributes({
        "page.path": path,
        "page.search": search,
        "page.url": fullPath,
        "page.referrer": document.referrer,
      });

      span.addEvent("page_view", {
        path: fullPath,
        timestamp: Date.now(),
      });
    });

    // Set Sentry context
    Sentry.getCurrentScope().setContext("page", {
      path,
      search,
      url: fullPath,
    });

    console.log(`[Page Tracking] ${fullPath}`, {
      traceId: getCurrentTraceId(),
    });
  }, [location]);
}

/**
 * Hook to track user interactions (clicks, form submissions, etc.)
 *
 * Returns a function that can be called to track any user action.
 * Creates both a Sentry breadcrumb and an OpenTelemetry span.
 *
 * @example
 * function MyButton() {
 *   const trackAction = useActionTracking();
 *
 *   const handleClick = () => {
 *     trackAction('button.click', { buttonName: 'submit' });
 *     // ... rest of handler
 *   };
 *
 *   return <button onClick={handleClick}>Submit</button>;
 * }
 */
export function useActionTracking() {
  return useCallback((actionName: string, data?: Record<string, any>) => {
    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: "user.action",
      message: actionName,
      level: "info",
      data: {
        ...data,
        timestamp: Date.now(),
      },
    });

    // Create OpenTelemetry span
    createSpan(`user.action.${actionName}`, async (span) => {
      span.setAttributes({
        "action.name": actionName,
        "action.timestamp": Date.now(),
        ...Object.entries(data || {}).reduce(
          (acc, [key, value]) => {
            acc[`action.${key}`] = String(value);
            return acc;
          },
          {} as Record<string, string>,
        ),
      });

      span.addEvent("user_action", {
        action: actionName,
        ...data,
      });
    });

    console.log(`[Action Tracking] ${actionName}`, data);
  }, []);
}

/**
 * Hook to track download job operations
 *
 * Specialized hook for tracking download-related actions with comprehensive
 * context including job IDs, file information, and trace correlation.
 *
 * @example
 * function DownloadButton({ jobId }) {
 *   const trackDownload = useDownloadTracking();
 *
 *   const handleDownload = () => {
 *     trackDownload('initiate', { jobId, fileName: 'file.zip' });
 *     // ... API call
 *   };
 *
 *   return <button onClick={handleDownload}>Download</button>;
 * }
 */
export function useDownloadTracking() {
  return useCallback(
    (
      operation: "initiate" | "complete" | "fail" | "cancel",
      data?: Record<string, any>,
    ) => {
      const traceId = getCurrentTraceId();

      // Add Sentry breadcrumb with download context
      Sentry.addBreadcrumb({
        category: "download",
        message: `Download ${operation}`,
        level: operation === "fail" ? "error" : "info",
        data: {
          ...data,
          operation,
          traceId,
          timestamp: Date.now(),
        },
      });

      // Create OpenTelemetry span for download operation
      createSpan(`download.${operation}`, async (span) => {
        span.setAttributes({
          "download.operation": operation,
          "download.trace_id": traceId || "unknown",
          "download.timestamp": Date.now(),
          ...Object.entries(data || {}).reduce(
            (acc, [key, value]) => {
              acc[`download.${key}`] = String(value);
              return acc;
            },
            {} as Record<string, string>,
          ),
        });

        span.addEvent(`download_${operation}`, {
          operation,
          ...data,
        });

        // Mark span as error if operation failed
        if (operation === "fail") {
          span.setStatus({
            code: 2, // ERROR
            message: data?.error || "Download failed",
          });
        }
      });

      // Set Sentry context for download
      Sentry.getCurrentScope().setContext("download", {
        operation,
        ...data,
        traceId,
      });

      console.log(`[Download Tracking] ${operation}`, { ...data, traceId });
    },
    [],
  );
}

/**
 * Hook to track API call performance
 *
 * Wraps an async function with performance tracking, creating spans
 * and breadcrumbs for the entire operation including timing and results.
 *
 * @example
 * function useMyData() {
 *   const trackApiCall = useApiTracking();
 *
 *   const fetchData = async () => {
 *     return trackApiCall('fetchUsers', async () => {
 *       const response = await api.get('/users');
 *       return response.data;
 *     });
 *   };
 *
 *   return { fetchData };
 * }
 */
export function useApiTracking() {
  return useCallback(
    async <T>(operationName: string, apiCall: () => Promise<T>): Promise<T> => {
      const startTime = performance.now();
      const traceId = getCurrentTraceId();

      try {
        // Add starting breadcrumb
        Sentry.addBreadcrumb({
          category: "api",
          message: `API call started: ${operationName}`,
          level: "info",
          data: {
            operation: operationName,
            traceId,
          },
        });

        // Execute the API call within a span
        const result = await createSpan(
          `api.${operationName}`,
          async (span) => {
            span.setAttributes({
              "api.operation": operationName,
              "api.trace_id": traceId || "unknown",
              "api.start_time": startTime,
            });

            const data = await apiCall();

            const duration = performance.now() - startTime;
            span.setAttributes({
              "api.duration_ms": duration,
              "api.success": true,
            });

            span.addEvent("api_success", {
              operation: operationName,
              duration,
            });

            return data;
          },
        );

        const duration = performance.now() - startTime;

        // Add success breadcrumb
        Sentry.addBreadcrumb({
          category: "api",
          message: `API call succeeded: ${operationName}`,
          level: "info",
          data: {
            operation: operationName,
            duration,
            traceId,
          },
        });

        console.log(
          `[API Tracking] ${operationName} succeeded in ${duration.toFixed(2)}ms`,
        );

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        // Add error breadcrumb
        Sentry.addBreadcrumb({
          category: "api",
          message: `API call failed: ${operationName}`,
          level: "error",
          data: {
            operation: operationName,
            error: error instanceof Error ? error.message : String(error),
            duration,
            traceId,
          },
        });

        // Capture error with context
        Sentry.captureException(error, {
          tags: {
            operation: operationName,
            api_call: true,
            trace_id: traceId || "unknown",
          },
          contexts: {
            api: {
              operation: operationName,
              duration,
              traceId,
            },
          },
        });

        console.error(
          `[API Tracking] ${operationName} failed after ${duration.toFixed(2)}ms`,
          error,
        );

        throw error;
      }
    },
    [],
  );
}

/**
 * Hook to set user context for Sentry
 *
 * Sets user information in Sentry for better error correlation.
 * Call this when user logs in or when user information changes.
 *
 * @example
 * function LoginSuccess({ user }) {
 *   const setUser = useUserTracking();
 *
 *   useEffect(() => {
 *     setUser({
 *       id: user.id,
 *       email: user.email,
 *       username: user.username,
 *     });
 *   }, [user]);
 *
 *   return <div>Welcome, {user.username}!</div>;
 * }
 */
export function useUserTracking() {
  return useCallback(
    (user: { id: string; email?: string; username?: string } | null) => {
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });

        Sentry.addBreadcrumb({
          category: "auth",
          message: "User identified",
          level: "info",
          data: {
            userId: user.id,
            username: user.username,
          },
        });

        console.log("[User Tracking] User identified:", user.id);
      } else {
        Sentry.setUser(null);

        Sentry.addBreadcrumb({
          category: "auth",
          message: "User logged out",
          level: "info",
        });

        console.log("[User Tracking] User logged out");
      }
    },
    [],
  );
}

/**
 * Hook to track errors with additional context
 *
 * Provides a function to manually capture errors with custom context.
 * Use this for catching and reporting expected errors in try-catch blocks.
 *
 * @example
 * function MyComponent() {
 *   const trackError = useErrorTracking();
 *
 *   const handleOperation = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       trackError(error, 'riskyOperation', { userId: '123' });
 *     }
 *   };
 *
 *   return <button onClick={handleOperation}>Do It</button>;
 * }
 */
export function useErrorTracking() {
  return useCallback(
    (error: Error | unknown, context?: string, data?: Record<string, any>) => {
      const traceId = getCurrentTraceId();

      Sentry.captureException(error, {
        tags: {
          context: context || "unknown",
          trace_id: traceId || "unknown",
        },
        contexts: {
          error_context: {
            context,
            traceId,
            ...data,
          },
        },
      });

      console.error(`[Error Tracking] ${context || "Error"}:`, error, {
        traceId,
        ...data,
      });
    },
    [],
  );
}
