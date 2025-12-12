import { AlertTriangle } from 'lucide-react'
export function ErrorLog() {
  const errors = [
    { id: 1, message: 'File not found', severity: 'error', timestamp: new Date() },
  ]
  return (
    <div className="card">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-error" />
        Error Log
      </h2>
      <div className="space-y-2">
        {errors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No errors captured. All systems operational! 🎉
          </div>
        ) : (
          errors.map((error) => (
            <div key={error.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="font-medium text-error">{error.message}</div>
              <div className="text-xs text-gray-400 mt-1">{error.timestamp.toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
      <a
        href="https://sentry.io"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-primary hover:underline text-sm"
      >
        View in Sentry Dashboard →
      </a>
    </div>
  )
}