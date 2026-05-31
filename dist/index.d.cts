type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
interface RetryConfig {
    retries?: number;
    retryDelay?: number;
    retryOn5xx?: boolean;
}
/** Context object passed through every registered plugin */
interface TurboContext {
    request: TurboRequestConfig;
    response?: TurboResponse;
    method: HttpMethod;
    url: string;
}
/** Next function to yield execution to the subsequent plugin */
type TurboNext = () => Promise<void>;
/** Middleware plugin function signature */
type TurboMiddleware = (ctx: TurboContext, next: TurboNext) => Promise<void>;
interface TurboRequestConfig {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
    params?: Record<string, string | number | boolean>;
    data?: any;
    signal?: AbortSignal;
    retry?: RetryConfig;
}
interface TurboResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
}

/**
 * src/client/turbo.ts
 */

declare class Turbo {
    private defaults;
    private middlewares;
    constructor(config?: TurboRequestConfig);
    use(middleware: TurboMiddleware): this;
    private request;
    get<T = any>(url: string, config?: TurboRequestConfig): Promise<TurboResponse<T>>;
    post<T = any>(url: string, data?: any, config?: TurboRequestConfig): Promise<TurboResponse<T>>;
}

/**
 * src/errors/index.ts
 *
 * Production-grade custom errors that preserve stack traces
 * and capture detailed request/response context.
 */

declare class TurboError extends Error {
    config: TurboRequestConfig;
    response?: TurboResponse;
    code?: string;
    constructor(message: string, config: TurboRequestConfig, response?: TurboResponse, code?: string);
}
declare class TurboResponseError extends TurboError {
    readonly isTurboResponseError = true;
    constructor(status: number, response: TurboResponse);
    constructor(message: string, config: TurboRequestConfig, response: TurboResponse);
    static [Symbol.hasInstance](instance: any): boolean;
}

declare const turboBase: {
    get: <T = any>(url: string, config?: TurboRequestConfig) => Promise<TurboResponse<T>>;
    post: <T = any>(url: string, data?: any, config?: TurboRequestConfig) => Promise<TurboResponse<T>>;
    use: (middleware: TurboMiddleware) => Turbo;
    create: (config?: TurboRequestConfig) => Turbo;
    Turbo: typeof Turbo;
    TurboResponseError: typeof TurboResponseError;
};

export { type HttpMethod, type RetryConfig, type TurboContext, type TurboMiddleware, type TurboNext, type TurboRequestConfig, type TurboResponse, turboBase as default };
