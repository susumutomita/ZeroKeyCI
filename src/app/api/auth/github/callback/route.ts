import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github-client';
import { logger } from '@/lib/logger';

/**
 * GitHub OAuth callback endpoint
 * Handles the OAuth flow after user authorizes the app
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    logger.warn('GitHub OAuth error', {
      error,
      error_description: searchParams.get('error_description'),
    });

    return NextResponse.redirect(
      new URL(
        `/setup?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(searchParams.get('error_description') || '')}`,
        request.url
      )
    );
  }

  // Validate code parameter
  if (!code) {
    logger.error('Missing OAuth code parameter');
    return NextResponse.redirect(
      new URL('/setup?error=missing_code', request.url)
    );
  }

  // Validate state parameter (CSRF protection)
  // TODO: In production, verify state against session-stored value
  if (!state) {
    logger.warn('Missing state parameter (CSRF risk)');
  }

  try {
    // Get OAuth credentials from environment
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('Missing GitHub OAuth credentials in environment');
      return NextResponse.redirect(
        new URL('/setup?error=configuration_error', request.url)
      );
    }

    // Exchange code for access token
    logger.info('Exchanging OAuth code for token');
    const accessToken = await GitHubClient.exchangeCodeForToken(
      code,
      clientId,
      clientSecret
    );

    // Get user info to verify authentication
    const client = new GitHubClient(accessToken);
    const user = await client.getCurrentUser();

    logger.info('GitHub OAuth successful', {
      login: user.login,
      id: user.id,
    });

    // Create response with redirect to setup page
    const response = NextResponse.redirect(
      new URL('/setup?authenticated=true', request.url)
    );

    // Store access token in HTTP-only cookie
    response.cookies.set('github_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Also store user info
    response.cookies.set(
      'github_user',
      JSON.stringify({
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        name: user.name,
      }),
      {
        httpOnly: false, // Allow JavaScript access for UI
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      }
    );

    return response;
  } catch (error) {
    logger.error('OAuth callback error', error as Error);

    return NextResponse.redirect(
      new URL(
        `/setup?error=authentication_failed&error_description=${encodeURIComponent((error as Error).message)}`,
        request.url
      )
    );
  }
}
