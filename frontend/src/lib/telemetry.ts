import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
const provider = new WebTracerProvider()
provider.register({
  propagator: new W3CTraceContextPropagator(),
})