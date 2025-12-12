export interface HealthData {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    storage: "ok" | "error";
  };
  timestamp: string;
}
export interface DownloadJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  result?: {
    downloadUrl: string;
  };
}
