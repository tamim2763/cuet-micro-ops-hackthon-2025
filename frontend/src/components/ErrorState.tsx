import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showIcon?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  showIcon = true,
}: ErrorStateProps) {
  return (
    <div className="card text-center py-12">
      {showIcon && (
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
