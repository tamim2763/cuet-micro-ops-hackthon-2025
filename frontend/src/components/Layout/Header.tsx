import { Link, useLocation } from 'react-router-dom';
import { Download, Activity, AlertCircle, TrendingUp, BarChart } from 'lucide-react';
import { getCurrentTraceId } from '@/services/telemetry';
import clsx from 'clsx';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const traceId = getCurrentTraceId();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Download className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Download Service Monitor
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Real-time monitoring with Sentry & OpenTelemetry
              </p>
            </div>
          </div>
          {traceId && (
            <div className="hidden md:block">
              <div className="text-xs text-gray-500">Current Trace</div>
              <div className="text-xs font-mono text-gray-700 truncate max-w-[200px]">
                {traceId.substring(0, 16)}...
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
