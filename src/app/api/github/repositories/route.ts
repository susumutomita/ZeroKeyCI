import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github-client';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';

/**
 * List user's GitHub repositories
 */
export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('github_access_token')?.value;

    if (!accessToken) {
      logger.warn('Missing GitHub access token');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch repositories
    const client = new GitHubClient(accessToken);
    const repositories = await client.listRepositories({
      type: 'owner', // Only repositories user owns (can admin)
      sort: 'updated',
      per_page: 100,
    });

    // Filter to only repositories with admin permission
    const adminRepos = repositories.filter(
      (repo) => repo.permissions?.admin === true
    );

    logger.info('Fetched repositories', { count: adminRepos.length });

    return NextResponse.json(adminRepos);
  } catch (error) {
    logger.error('Failed to fetch repositories', error as Error);

    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
