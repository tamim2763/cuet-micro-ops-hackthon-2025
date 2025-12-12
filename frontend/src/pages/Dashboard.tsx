import { useEffect, useState } from 'react';
import { Activity, Download, AlertTriangle, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { createSpan, getCurrentTraceId } from '@/services/telemetry';
import { captureMessage } from '@/services/sentry';
import toast from 'react-hot-toast';
import { useHealthStore } from '@/stores/healthStore';
import type { HealthResponse } from '@/types';

function Dashboard() {
  const { health, setHealth, loading, setLoading, error, setError } = useHealthStore();
  const [testingSentry, setTestingSentry] = useState(false);

  // Fetch health status
  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch health';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Test Sentry integration
  const handleSentryTest = async () => {
    setTestingSentry(true);
    try {
      await createSpan(
        'user.test_sentry',
        async () => {
          await api.checkDownload(70000, true);
        },
        { 'test.type': 'sentry_error' }
      );
    } catch (err) {
      const traceId = getCurrentTraceId();
      captureMessage('Sentry test completed - error captured successfully', 'info');
      toast.success(`Sentry test triggered! Check your Sentry dashboard.\nTrace ID: ${traceId}`);
    } finally {
      setTestingSentry(false);
    }
  };

  // Test OpenTelemetry tracing
  const handleTracingTest = async () => {
    const traceId = getCurrentTraceId();
    await createSpan(
      'user.test_tracing',
      async () => {
        captureMessage('Testing OpenTelemetry trace propagation', 'info');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      { 'test.type': 'tracing' }
    );

    const jaegerUrl = import.meta.env.VITE_JAEGER_UI_URL || 'http://localhost:16686';
    toast.success(
      `Tracing test completed!\nTrace ID: ${traceId}\n\nView in Jaeger: ${jaegerUrl}/trace/${traceId}`,
      { duration: 5000 }
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchHealth();
    toast.success('Health status refreshed');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and observability</p>
        </div>
        <button onClick={handleRefresh} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* API Health */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Status</p>
              {loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : (
                <p className={`text-lg font-semibold ${getStatusColor(health?.status || 'unhealthy')}`}>
                  {health?.status || 'Unknown'}
                </p>
              )}
            </div>
            <Activity className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        {/* Storage Status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage</p>
              {loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : (
                <p
                  className={`text-lg font-semibold ${
                    health?.storage.connected ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {health?.storage.connected ? 'Connected' : 'Disconnected'}
                </p>
              )}
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Tracing Status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tracing</p>
              {loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : (
                <p
                  className={`text-lg font-semibold ${
                    health?.observability.tracing ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {health?.observability.tracing ? 'Active' : 'Inactive'}
                </p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Sentry Status */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sentry</p>
              {loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <p className="text-sm text-gray-400">Loading...</p>
                </div>
              ) : (
                <p
                  className={`text-lg font-semibold ${
                    health?.observability.sentry ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {health?.observability.sentry ? 'Active' : 'Inactive'}
                </p>
              )}
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Health Details */}
      {health && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Health Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">S3 Bucket</p>
              <p className="text-lg font-semibold text-gray-900">{health.storage.bucket}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current Trace ID</p>
              <p className="text-sm font-mono text-gray-700 truncate">
                {getCurrentTraceId() || 'No active trace'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Testing Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🧪 Test Observability Integration</h2>
        <p className="text-gray-600 mb-6">
          Use these buttons to test the Sentry and OpenTelemetry integrations:
        </p>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleSentryTest} disabled={testingSentry} className="btn btn-danger">
            {testingSentry ? 'Testing...' : 'Test Sentry Error'}
          </button>
          <button onClick={handleTracingTest} className="btn btn-primary">
            Test Tracing
          </button>
          <a
            href={import.meta.env.VITE_JAEGER_UI_URL || 'http://localhost:16686'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Open Jaeger UI
          </a>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 Phase 2 Complete!</h2>
        <div className="space-y-3 text-gray-600">
          <p>The core application structure is now set up. Here's what's been implemented:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>✅ React Router with lazy loading</li>
            <li>✅ Layout components (Header, Sidebar, MainLayout)</li>
            <li>✅ Zustand stores for state management</li>
            <li>✅ Loading and error states</li>
            <li>✅ Toast notifications</li>
            <li>✅ Responsive navigation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
