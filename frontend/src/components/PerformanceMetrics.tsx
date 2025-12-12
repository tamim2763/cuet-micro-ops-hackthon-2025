import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
export function PerformanceMetrics() {
  const data = [
    { time: '10:00', responseTime: 120 },
    { time: '10:05', responseTime: 150 },
    { time: '10:10', responseTime: 180 },
    { time: '10:15', responseTime: 140 },
    { time: '10:20', responseTime: 160 },
  ]
  return (
    <div className="card">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        Performance Metrics
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip
            contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
          />
          <Line type="monotone" dataKey="responseTime" stroke="#3B82F6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">98.5%</div>
          <div className="text-xs text-gray-400">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">156ms</div>
          <div className="text-xs text-gray-400">Avg Response</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">42</div>
          <div className="text-xs text-gray-400">Req/min</div>
        </div>
      </div>
    </div>
  )
}