/**
 * src/errors/index.ts
 * 
 * Production-grade custom errors that preserve stack traces 
 * and capture detailed request/response context.
 */
import { TurboRequestConfig, TurboResponse } from '../types/index.js';

export class TurboError extends Error {
  public config: TurboRequestConfig;
  public response?: TurboResponse;
  public code?: string;

  constructor(message: string, config: TurboRequestConfig, response?: TurboResponse, code?: string) {
    super(message);
    this.name = 'TurboError';
    this.config = config;
    this.response = response;
    this.code = code;

    // Preserves the proper V8 stack trace, omitting the library internals
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class TurboNetworkError extends TurboError {
  constructor(message: string, config: TurboRequestConfig, originalError?: Error) {
    super(message, config, undefined, 'ERR_NETWORK');
    this.name = 'TurboNetworkError';
    if (originalError?.stack) {
      this.stack = `${this.stack}\nCAUSED BY: ${originalError.stack}`;
    }
  }
}

export class TurboTimeoutError extends TurboError {
  constructor(message: string, config: TurboRequestConfig) {
    super(message, config, undefined, 'ERR_TIMEOUT');
    this.name = 'TurboTimeoutError';
  }
}

export class TurboResponseError extends TurboError {
  public readonly isTurboResponseError = true;

  constructor(status: number, response: TurboResponse);
  constructor(message: string, config: TurboRequestConfig, response: TurboResponse);
  constructor(
    messageOrStatus: string | number,
    configOrResponse: TurboRequestConfig | TurboResponse,
    maybeResponse?: TurboResponse
  ) {
    const response = maybeResponse ?? configOrResponse as TurboResponse;
    const config = maybeResponse ? configOrResponse as TurboRequestConfig : Object.create(null);
    const message = typeof messageOrStatus === 'number'
      ? `Request failed with status code ${messageOrStatus}`
      : messageOrStatus;

    super(message, config, response, `ERR_BAD_RESPONSE_${response.status}`);
    this.name = 'TurboResponseError';
    Object.setPrototypeOf(this, TurboResponseError.prototype);
  }

  static [Symbol.hasInstance](instance: any) {
    if (!instance) return false;
    return (
      instance.isTurboResponseError === true ||
      instance.name === 'TurboResponseError' ||
      instance.constructor?.name === 'TurboResponseError'
    );
  }
}
