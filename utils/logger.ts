/**
 * Production-safe logger.
 *
 * In production builds, babel-plugin-transform-remove-console strips all
 * console.* calls at build time. This wrapper is a belt-and-suspenders
 * guard for any logs added in the future.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.debug('something', data);
 *   logger.error('Failed to load', error);
 */

const isDev = __DEV__;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
