/**
 * src/plugins/opentelemetry.ts
 * 
 * Native OpenTelemetry distributed tracing context propagator plugin.
 */
import { TurboContext, TurboNext } from '../types/index.js';

// Dynamically handle optional OpenTelemetry API interfaces to avoid compilation errors
// if the consuming application hasn't installed the optional @opentelemetry/api package yet.
let trace: any = null;
let propagation: any = null;
let context: any = null;

try {
  // Graceful dependency resolution
  const oTelApi = require('@opentelemetry/api');
  trace = oTelApi.trace;
  propagation = oTelApi.propagation;
  context = oTelApi.context;
} catch {
  // OpenTelemetry API is not installed; plugin will run in silent pass-through mode
}

export async function openTelemetryPlugin(ctx: TurboContext, next: TurboNext): Promise<void> {
  // Pass-through fast path if OpenTelemetry is unavailable
  if (!trace || !propagation || !context) {
    await next();
    return;
  }

  const tracer = trace.getTracer('turboio-client', '1.0.0');
  
  // Start a structured client side Span conforming to OpenTelemetry semantic naming conventions
  const span = tracer.startSpan(`HTTP ${ctx.method}`, {
    kind: 1, // SpanKind.CLIENT
    attributes: {
      'http.method': ctx.method,
      'http.url': ctx.url,
      'component': 'turboio'
    }
  });

  // Inject W3C Trace Context headers (traceparent, tracestate) directly into outbound frames
  ctx.request.headers = ctx.request.headers || {};
  context.with(trace.setSpan(context.active(), span), () => {
    propagation.inject(context.active(), ctx.request.headers);
  });

  try {
    // Continue execution chain
    await next();

    // Log the resulting response criteria status attributes
    if (ctx.response) {
      span.setAttribute('http.status_code', ctx.response.status);
    }
    span.end();
  } catch (error: any) {
    // Capture runtime operational anomalies cleanly
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // SpanStatusCode.ERROR = 2
    span.end();
    throw error;
  }
}
