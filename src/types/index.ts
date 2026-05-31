export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RetryConfig {
  retries?: number;
  retryDelay?: number;
  retryOn5xx?: boolean;
}

/** Context object passed through every registered plugin */
export interface TurboContext {
  request: TurboRequestConfig;
  response?: TurboResponse;
  method: HttpMethod;
  url: string;
}

/** Next function to yield execution to the subsequent plugin */
export type TurboNext = () => Promise<void>;

/** Middleware plugin function signature */
export type TurboMiddleware = (ctx: TurboContext, next: TurboNext) => Promise<void>;

export interface TurboRequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
  data?: any;
  signal?: AbortSignal;
  retry?: RetryConfig;
}

export interface TurboResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
}
