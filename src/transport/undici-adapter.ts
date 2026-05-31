/**
 * src/transport/undici-adapter.ts
 */
import { request } from 'undici';
import { STATUS_CODES } from 'node:http';
import { HttpMethod, TurboRequestConfig, TurboResponse } from '../types/index.js';
import { TurboResponseError } from '../errors/index.js';

const yieldBodyCleanup = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * High-performance, low-overhead HTTP dispatcher utilizing undici request layers.
 */
export async function executeRequest<T = any>(
  method: HttpMethod,
  url: string,
  config: TurboRequestConfig
): Promise<TurboResponse<T>> {
  const finalUrl = config.baseURL ? `${config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  
  // 1. TIMEOUT FIX: Automatically set up AbortSignal.timeout if a timeout parameter is explicitly declared
  let requestSignal = config.signal;
  if (config.timeout && config.timeout > 0 && !requestSignal) {
    requestSignal = AbortSignal.timeout(config.timeout);
  }

  // Execute the underlying connection frame
  const response = await request(finalUrl, {
    method,
    headers: config.headers,
    body: config.data ? JSON.stringify(config.data) : undefined,
    signal: requestSignal ?? undefined,
  });

  // Accumulate the raw network chunk streams into string buffers
  const rawData = await response.body.text();
  await yieldBodyCleanup();
  
  // 2. PARSING GUARD: Safely cast incoming JSON bodies to objects if applicable
  let formattedData: any = rawData;
  const contentType = response.headers['content-type'];
  if (typeof rawData === 'string' && rawData.length > 0) {
    if (!contentType || (typeof contentType === 'string' && contentType.includes('application/json'))) {
      try {
        formattedData = JSON.parse(rawData);
      } catch {
        // Fallback gracefully to raw text if the body string isn't valid JSON
      }
    }
  }

  const result: TurboResponse<T> = {
    data: formattedData,
    status: response.statusCode,
    statusText: STATUS_CODES[response.statusCode] ?? '',
    headers: response.headers as Record<string, string | string[]>,
  };

  // If the server emits a bad client/server response, bubble it up as an error signature
  if (response.statusCode >= 400) {
    throw new TurboResponseError(response.statusCode, result);
  }

  return result;
}
