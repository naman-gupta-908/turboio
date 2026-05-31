/**
 * src/plugins/token-refresher.ts
 * 
 * Production-grade OAuth2 Token Refresh Plugin with concurrent request locking.
 */
import { TurboContext, TurboNext, TurboMiddleware } from '../types/index.js';
import turbo from '../index.js';

interface TokenRefresherOptions {
  initialToken?: string;
  refreshToken: string;
  tokenEndpoint: string;
  clientId: string;
}

export function createTokenRefresherPlugin(options: TokenRefresherOptions): TurboMiddleware {
  let currentAccessToken = options.initialToken || '';
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  // Helper to notify all queued requests waiting for the new token
  function onTokenRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
  }

  /**
   * Executes the OAuth2 Client Credentials / Refresh Token grant layout
   */
  async function performRefresh(): Promise<string> {
    try {
      // Use a separate, clean default instance of turbo to avoid infinite plugin recursion loops
      const response = await turbo.post(options.tokenEndpoint, {
        grant_type: 'refresh_token',
        refresh_token: options.refreshToken,
        client_id: options.clientId,
      });

      // Assuming standard OAuth2 response payload body format: { access_token: string }
      return response.data.access_token;
    } catch (error) {
      throw new Error(`[TokenRefresher] Critical failure refreshing authentication token: ${error}`);
    }
  }

  return async function (ctx: TurboContext, next: TurboNext): Promise<void> {
    // 1. Inject the known working access token if available
    if (currentAccessToken) {
      ctx.request.headers = ctx.request.headers || {};
      ctx.request.headers['authorization'] = `Bearer ${currentAccessToken}`;
    }

    // 2. Pass control downstream down the execution engine stack
    await next();

    // 3. Inspect the upstream response contract on the way back out
    if (ctx.response && ctx.response.status === 401) {
      console.log(`⚠️ [Plugin Auth] 401 Unauthorized captured on ${ctx.url}. Initiating refresh strategy.`);

      // If a refresh is already underway, suspend this execution path until it completes
      if (isRefreshing) {
        const freshToken = await new Promise<string>((resolve) => {
          refreshSubscribers.push((token: string) => resolve(token));
        });

        // Re-assign the new header values and run the core dispatcher path directly
        ctx.request.headers = ctx.request.headers || {};
        ctx.request.headers['authorization'] = `Bearer ${freshToken}`;
        return; 
      }

      // Lock the engine state
      isRefreshing = true;

      try {
        const newAccessToken = await performRefresh();
        currentAccessToken = newAccessToken;
        isRefreshing = false;

        // Release all pending queued requests
        onTokenRefreshed(newAccessToken);

        // Update the current request parameters and let it transparently execute
        ctx.request.headers = ctx.request.headers || {};
        ctx.request.headers['authorization'] = `Bearer ${newAccessToken}`;
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        throw refreshError;
      }
    }
  };
}
