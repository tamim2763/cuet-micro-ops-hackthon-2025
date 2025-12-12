import { useQuery } from '@tanstack/react-query'
import { Activity, Database, Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { HealthData } from '../types'
export function HealthStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get<HealthData>('/health')
      return response.data
    },
    refetchInterval: 5000,
  })
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <XCircle className="w-5 h-5 text-error" />
      default:
        return <AlertCircle className="w-5 h-5 text-warning" />
    }
  }
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success'
      case 'degraded':
        return 'bg-warning'
      default:
        return 'bg-error'
    }
  }
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Health Status
        </h2>
        <div className={`status-dot ${getStatusColor(data?.status)}`} />
      </div>
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* API Status */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              API Server
            </span>
            {getStatusIcon('ok')}
          </div>
          {/* S3 Storage */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              S3 Storage
            </span>
            {getStatusIcon(data?.checks?.storage)}
          </div>
          {/* Last Updated */}
          <div className="text-sm text-gray-400 mt-4">
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
}