/**
 * src/core/utils.ts
 * 
 * High-performance micro-utilities designed to minimize memory allocation
 * and leverage fast-path execution in the V8 engine.
 */

/**
 * Merges a request-specific config into default settings without 
 * relying on slow object spread syntax or deep cloning.
 */
export function mergeConfig(defaults: any, config: any): any {
  // If no config is passed, fallback immediately to frozen defaults
  if (!config) return defaults;

  const result = Object.assign(Object.create(null), defaults);
  
  // Explicit loop assignment is faster and predictable for V8 optimization vectors
  const keys = Object.keys(config);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'headers' && defaults.headers && config.headers) {
      // Custom low-allocation merge for headers object
      result.headers = Object.assign(Object.create(null), defaults.headers, config.headers);
    } else if (key === 'retry' && defaults.retry && config.retry) {
      result.retry = Object.assign(Object.create(null), defaults.retry, config.retry);
    } else {
      result[key] = config[key];
    }
  }

  return result;
}

/**
 * Optimizes header lookup speed by ensuring keys are strictly lowercase.
 */
export function normalizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return Object.create(null);
  
  const normalized = Object.create(null);
  const keys = Object.keys(headers);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    normalized[key.toLowerCase()] = headers[key];
  }
  
  return normalized;
}
