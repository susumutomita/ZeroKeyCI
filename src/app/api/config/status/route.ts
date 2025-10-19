import { NextResponse } from 'next/server';
import { validateConfig } from '@/lib/config-validator';

/**
 * Configuration status endpoint
 * Returns feature flags and configuration status
 */
export async function GET() {
  const { features, validation } = validateConfig();

  return NextResponse.json({
    features,
    isValid: validation.isValid,
    // Don't expose detailed errors to the client for security
    // Just indicate what features are available
  });
}
