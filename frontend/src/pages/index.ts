import { lazy } from "react";

// Lazy load pages for code splitting
export const Dashboard = lazy(() => import("./Dashboard"));
export const DownloadJobs = lazy(() => import("./DownloadJobs"));
export const ErrorLog = lazy(() => import("./ErrorLog"));
export const TraceViewer = lazy(() => import("./TraceViewer"));
export const PerformanceMetrics = lazy(() => import("./PerformanceMetrics"));
