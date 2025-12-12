/**
 * TraceDisplay Component
 *
 * Displays the current trace ID with actions to copy or view in Jaeger.
 * Can be placed in headers, error screens, or download job cards for
 * easy trace correlation and debugging.
 */

import { useState, useEffect } from "react";
import { getCurrentTraceId } from "../services/telemetry";
import {
  formatTraceId,
  copyTraceId,
  openTraceInJaeger,
  isValidTraceId,
} from "../utils/observability";

interface TraceDisplayProps {
  /**
   * Custom trace ID to display (if not provided, uses current trace)
   */
  traceId?: string | null;

  /**
   * Show copy button
   */
  showCopy?: boolean;

  /**
   * Show Jaeger link button
   */
  showJaegerLink?: boolean;

  /**
   * Display format: compact, full, or badge
   */
  format?: "compact" | "full" | "badge";

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Label text
   */
  label?: string;
}

export function TraceDisplay({
  traceId: providedTraceId,
  showCopy = true,
  showJaegerLink = true,
  format = "compact",
  className = "",
  label = "Trace ID",
}: TraceDisplayProps) {
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get trace ID from props or current context
  const traceId = providedTraceId || currentTraceId;
  const isValid = isValidTraceId(traceId);

  useEffect(() => {
    if (!providedTraceId) {
      // Update current trace ID every second
      const interval = setInterval(() => {
        setCurrentTraceId(getCurrentTraceId());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [providedTraceId]);

  const handleCopy = async () => {
    const success = await copyTraceId(traceId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenJaeger = () => {
    openTraceInJaeger(traceId);
  };

  if (!isValid && !traceId) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {label}: Not available
      </div>
    );
  }

  const formattedTraceId = formatTraceId(traceId);

  // Badge format - minimal display
  if (format === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono ${className}`}
        title={`${label}: ${traceId}`}
      >
        <span className="text-blue-700">{formattedTraceId.slice(0, 8)}...</span>
        {showCopy && (
          <button
            onClick={handleCopy}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Copy trace ID"
          >
            {copied ? "✓" : "📋"}
          </button>
        )}
      </div>
    );
  }

  // Compact format - one line
  if (format === "compact") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <span className="text-gray-600 font-medium">{label}:</span>
        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-xs">
          {formattedTraceId}
        </code>

        {showCopy && (
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="Copy trace ID"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        )}

        {showJaegerLink && isValid && (
          <button
            onClick={handleOpenJaeger}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="View in Jaeger"
          >
            🔍 Jaeger
          </button>
        )}
      </div>
    );
  }

  // Full format - card display
  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}
    >
      <div className="mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>

      <div className="mb-3">
        <code className="block px-3 py-2 bg-gray-50 rounded font-mono text-sm break-all">
          {traceId}
        </code>
      </div>

      <div className="flex gap-2">
        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {copied ? "✓ Copied to Clipboard" : "📋 Copy Trace ID"}
          </button>
        )}

        {showJaegerLink && isValid && (
          <button
            onClick={handleOpenJaeger}
            className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            🔍 View in Jaeger
          </button>
        )}
      </div>

      {!isValid && traceId && (
        <div className="mt-2 text-xs text-amber-600">
          ⚠️ Invalid trace ID format
        </div>
      )}
    </div>
  );
}

/**
 * Inline Trace Badge - Very compact display for headers/footers
 */
export function InlineTraceBadge({ className = "" }: { className?: string }) {
  return (
    <TraceDisplay
      format="badge"
      showCopy={true}
      showJaegerLink={false}
      className={className}
    />
  );
}

/**
 * Trace Card - Full featured card for error screens
 */
export function TraceCard({
  traceId,
  className = "",
}: {
  traceId?: string | null;
  className?: string;
}) {
  return (
    <TraceDisplay
      traceId={traceId}
      format="full"
      showCopy={true}
      showJaegerLink={true}
      className={className}
    />
  );
}
