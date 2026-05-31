/**
 * src/core/pipeline.ts
 * 
 * High-performance asynchronous middleware composition engine.
 * Implements a Koa-style onion model.
 */
import { TurboContext, TurboMiddleware } from '../types/index.js';

export function compose(middlewares: TurboMiddleware[]) {
  return function (context: TurboContext, next: () => Promise<void>): Promise<void> {
    let index = -1;

    function dispatch(i: number): Promise<void> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times within a single plugin'));
      }
      index = i;

      let fn = middlewares[i];
      if (i === middlewares.length) {
        fn = next;
      }

      if (!fn) return Promise.resolve();

      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
