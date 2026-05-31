/**
 * src/index.ts
 */
import { Turbo } from './client/turbo.js';
import { TurboRequestConfig } from './types/index.js';
import { TurboResponseError } from './core/error.js';

const defaultInstance = new Turbo();

const turboBase = {
  get: defaultInstance.get.bind(defaultInstance),
  post: defaultInstance.post.bind(defaultInstance),
  use: defaultInstance.use.bind(defaultInstance),
  
  create: (config?: TurboRequestConfig): Turbo => {
    return new Turbo(config);
  },
  
  Turbo,
  TurboResponseError // Attaches class token for CJS bundle consumption
};

export default turboBase;
export type * from './types/index.js';
