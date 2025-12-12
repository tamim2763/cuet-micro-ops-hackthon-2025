import { FileSearch, ExternalLink } from 'lucide-react'
export function TraceViewer() {
  const jaegerUrl = import.meta.env.VITE_JAEGER_URL
  const traces = [
    { id: 'abc123def456', operation: 'download.initiate', duration: 1234 },
  ]
  return (
    <div className="card">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <FileSearch className="w-5 h-5 text-primary" />
        Trace Viewer
      </h2>
      <div className="space-y-2">
        {traces.map((trace) => (
          <div key={trace.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm">{trace.id}</div>
                <div className="text-xs text-gray-400">{trace.operation} • {trace.duration}ms</div>
              </div>
              <a
                href={`${jaegerUrl}/trace/${trace.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-4 h-4 text-primary" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}