import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HealthStatus } from './components/HealthStatus'
import { DownloadJobs } from './components/DownloadJobs'
import { ErrorLog } from './components/ErrorLog'
import { TraceViewer } from './components/TraceViewer'
import { PerformanceMetrics } from './components/PerformanceMetrics'
import { Activity } from 'lucide-react'
const queryClient = new QueryClient()
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Delineate Observability
            </h1>
          </div>
          <p className="text-gray-400">Real-time monitoring, tracing, and error tracking</p>
        </header>
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Row */}
          <HealthStatus />
          <PerformanceMetrics />
          
          {/* Middle Row */}
          <div className="lg:col-span-2">
            <DownloadJobs />
          </div>
          
          {/* Bottom Row */}
          <ErrorLog />
          <TraceViewer />
        </div>
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          Challenge 4: Observability Dashboard | CUET Micro Ops Hackathon 2025
        </footer>
      </div>
    </QueryClientProvider>
  )
}
export default App