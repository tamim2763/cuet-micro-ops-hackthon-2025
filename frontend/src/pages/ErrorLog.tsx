import { AlertCircle } from "lucide-react";

function ErrorLog() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Error Log</h1>
        <p className="text-gray-600 mt-1">View and analyze captured errors</p>
      </div>

      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Coming in Phase 3
        </h3>
        <p className="text-gray-600">
          Error log viewer with Sentry integration will be implemented in the
          next phase.
        </p>
      </div>
    </div>
  );
}

export default ErrorLog;
