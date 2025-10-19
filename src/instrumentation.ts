import { logConfigStatus } from './lib/config-validator';

/**
 * Next.js instrumentation hook
 * Runs once when the server starts up
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Log configuration status on server startup
    logConfigStatus();
  }
}
