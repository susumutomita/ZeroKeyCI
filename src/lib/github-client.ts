/**
 * GitHub API Client for OAuth and repository operations
 * Handles authentication, repository listing, and PR creation
 */

import { logger } from './logger';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubPullRequest {
  number: number;
  html_url: string;
  title: string;
  state: string;
  created_at: string;
}

export interface CreatePROptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string; // branch name
  base: string; // base branch (usually 'main' or 'master')
  files: Array<{
    path: string;
    content: string;
  }>;
}

export class GitHubClient {
  private accessToken: string;
  private baseUrl = 'https://api.github.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Exchange OAuth code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<string> {
    logger.debug('Exchanging OAuth code for access token');

    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub OAuth failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `GitHub OAuth error: ${data.error_description || data.error}`
      );
    }

    if (!data.access_token) {
      throw new Error('No access token received from GitHub');
    }

    logger.info('Successfully exchanged OAuth code for access token');
    return data.access_token;
  }

  /**
   * Get authenticated user information
   */
  async getCurrentUser(): Promise<GitHubUser> {
    logger.debug('Fetching current user info');

    const response = await this.request<GitHubUser>('/user');
    logger.info('Fetched user info', { login: response.login });

    return response;
  }

  /**
   * List repositories for authenticated user
   */
  async listRepositories(
    options: {
      type?: 'all' | 'owner' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      per_page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    const { type = 'owner', sort = 'updated', per_page = 100 } = options;

    logger.debug('Fetching repositories', { type, sort, per_page });

    const params = new URLSearchParams({
      type,
      sort,
      per_page: per_page.toString(),
    });

    const repos = await this.request<GitHubRepository[]>(
      `/user/repos?${params}`
    );

    logger.info('Fetched repositories', { count: repos.length });
    return repos;
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    logger.debug('Fetching repository', { owner, repo });

    const repository = await this.request<GitHubRepository>(
      `/repos/${owner}/${repo}`
    );

    logger.info('Fetched repository info', { full_name: repository.full_name });
    return repository;
  }

  /**
   * Create a new branch from base
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    baseSha: string
  ): Promise<void> {
    logger.debug('Creating branch', { owner, repo, branchName });

    await this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });

    logger.info('Created branch', { branchName });
  }

  /**
   * Get SHA of latest commit on branch
   */
  async getLatestCommitSha(
    owner: string,
    repo: string,
    branch: string
  ): Promise<string> {
    logger.debug('Fetching latest commit SHA', { owner, repo, branch });

    const response = await this.request<{ object: { sha: string } }>(
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`
    );

    return response.object.sha;
  }

  /**
   * Create or update file contents
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<void> {
    logger.debug('Creating/updating file', { owner, repo, path, branch });

    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    await this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    logger.info('File created/updated', { path });
  }

  /**
   * Create a pull request with multiple files
   */
  async createPullRequest(
    options: CreatePROptions
  ): Promise<GitHubPullRequest> {
    const { owner, repo, title, body, head, base, files } = options;

    logger.info('Creating pull request', {
      owner,
      repo,
      title,
      fileCount: files.length,
    });

    try {
      // Get base branch SHA
      const baseSha = await this.getLatestCommitSha(owner, repo, base);

      // Create new branch
      await this.createBranch(owner, repo, head, baseSha);

      // Create/update files on new branch
      for (const file of files) {
        await this.createOrUpdateFile(
          owner,
          repo,
          file.path,
          file.content,
          `Add ${file.path}`,
          head
        );
      }

      // Create pull request
      const pr = await this.request<GitHubPullRequest>(
        `/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            body,
            head,
            base,
          }),
        }
      );

      logger.info('Pull request created', {
        number: pr.number,
        url: pr.html_url,
      });

      return pr;
    } catch (error) {
      logger.error('Failed to create pull request', error as Error, {
        owner,
        repo,
        head,
        base,
      });
      throw error;
    }
  }

  /**
   * Check if file exists in repository
   */
  async fileExists(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<boolean> {
    try {
      const params = ref ? `?ref=${ref}` : '';
      await this.request(`/repos/${owner}/${repo}/contents/${path}${params}`);
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generic request helper
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw Object.assign(
        new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        ),
        {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        }
      );
    }

    return response.json() as Promise<T>;
  }
}
