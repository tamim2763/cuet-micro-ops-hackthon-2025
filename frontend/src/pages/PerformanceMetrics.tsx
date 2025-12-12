import { BarChart } from "lucide-react";

function PerformanceMetrics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Performance Metrics
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor API performance and metrics
        </p>
      </div>

      <div className="card text-center py-12">
        <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Coming in Phase 3
        </h3>
        <p className="text-gray-600">
          Performance metrics and charts will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
}

export default PerformanceMetrics;
