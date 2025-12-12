import { Activity } from 'lucide-react';

function TraceViewer() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trace Viewer</h1>
        <p className="text-gray-600 mt-1">Visualize distributed traces</p>
      </div>

      <div className="card text-center py-12">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming in Phase 3</h3>
        <p className="text-gray-600">
          Trace visualization with Jaeger integration will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
}

export default TraceViewer;
