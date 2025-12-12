import axios from "axios";
import * as Sentry from "@sentry/react";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Add trace propagation
api.interceptors.request.use((config) => {
  const span = Sentry.getCurrentHub().getScope()?.getSpan();
  if (span) {
    config.headers["traceparent"] = span.toTraceparent();
  }
  return config;
});
// Error capturing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    Sentry.captureException(error);
    return Promise.reject(error);
  },
);
