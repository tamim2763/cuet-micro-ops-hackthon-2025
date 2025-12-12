import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './services/sentry';
import { initTelemetry } from './services/telemetry';
import { initWebVitals } from './services/webVitals';

// Initialize observability services
// Order matters: Sentry first (for error capture), then OpenTelemetry (for tracing), then Web Vitals (depends on both)
initSentry();
initTelemetry();
initWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
