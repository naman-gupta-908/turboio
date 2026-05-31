/**
 * examples/enterprise-pipeline.ts
 * 
 * Runs both the Token Refresher and OpenTelemetry tracing plugins together.
 */
import turbo from '../src/index';
import { createTokenRefresherPlugin } from '../src/plugins/token-refresher';
import { openTelemetryPlugin } from '../src/plugins/opentelemetry';

async function runEnterpriseSetup() {
  console.log('--- Initializing Shared Enterprise Client Pipeline ---');

  const api = turbo.create({
    baseURL: 'https://api.internal-service.local',
    timeout: 5000
  });

  // 1. Register OpenTelemetry tracing plugin at the outermost layer of the onion
  api.use(openTelemetryPlugin);

  // 2. Register OAuth2 Token Refresher plugin inside the tracing perimeter
  api.use(createTokenRefresherPlugin({
    initialToken: 'EXPIRED_TOKEN_XYZ',
    refreshToken: 'VALID_REFRESH_TOKEN_123',
    tokenEndpoint: 'https://auth.internal-service.local/oauth/token',
    clientId: 'billing_service_micro'
  }));

  console.log('📦 Core enterprise request engine layers compiled successfully.');
}

runEnterpriseSetup();
