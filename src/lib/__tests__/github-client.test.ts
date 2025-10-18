import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubClient } from '../github-client';

describe('GitHubClient', () => {
  let client: GitHubClient;
  const mockAccessToken = 'gho_test_token_1234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubClient(mockAccessToken);
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange OAuth code for access token', async () => {
      const mockToken = 'gho_exchanged_token_abc123';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: mockToken }),
      });

      const token = await GitHubClient.exchangeCodeForToken(
        'code123',
        'client_id',
        'client_secret'
      );

      expect(token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({
            client_id: 'client_id',
            client_secret: 'client_secret',
            code: 'code123',
          }),
        })
      );
    });

    it('should throw error when OAuth exchange fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(
        GitHubClient.exchangeCodeForToken(
          'bad_code',
          'client_id',
          'client_secret'
        )
      ).rejects.toThrow('GitHub OAuth failed');
    });

    it('should throw error when access token is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'invalid_grant' }),
      });

      await expect(
        GitHubClient.exchangeCodeForToken('code', 'id', 'secret')
      ).rejects.toThrow();
    });

    it('should throw error when response is missing access_token field', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}), // No access_token field
      });

      await expect(
        GitHubClient.exchangeCodeForToken('code', 'id', 'secret')
      ).rejects.toThrow('No access token received from GitHub');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user information', async () => {
      const mockUser = {
        login: 'testuser',
        id: 12345,
        avatar_url: 'https://github.com/avatar.png',
        name: 'Test User',
        email: 'test@example.com',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });

      const user = await client.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should throw error when API call fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      await expect(client.getCurrentUser()).rejects.toThrow('GitHub API error');
    });
  });

  describe('listRepositories', () => {
    it('should list user repositories with default options', async () => {
      const mockRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'user/repo1',
          private: false,
          html_url: 'https://github.com/user/repo1',
          default_branch: 'main',
          permissions: { admin: true, push: true, pull: true },
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'user/repo2',
          private: true,
          html_url: 'https://github.com/user/repo2',
          default_branch: 'master',
          permissions: { admin: true, push: true, pull: true },
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRepos,
      });

      const repos = await client.listRepositories();

      expect(repos).toEqual(mockRepos);
      expect(repos).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/repos'),
        expect.any(Object)
      );
    });

    it('should support custom options', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await client.listRepositories({
        type: 'all',
        sort: 'created',
        per_page: 50,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=all'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=created'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=50'),
        expect.any(Object)
      );
    });
  });

  describe('getRepository', () => {
    it('should fetch repository information', async () => {
      const mockRepo = {
        id: 1,
        name: 'test-repo',
        full_name: 'user/test-repo',
        private: false,
        html_url: 'https://github.com/user/test-repo',
        default_branch: 'main',
        permissions: { admin: true, push: true, pull: true },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRepo,
      });

      const repo = await client.getRepository('user', 'test-repo');

      expect(repo).toEqual(mockRepo);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/test-repo',
        expect.any(Object)
      );
    });
  });

  describe('createBranch', () => {
    it('should create a new branch from SHA', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ref: 'refs/heads/feature',
          object: { sha: 'abc123' },
        }),
      });

      await client.createBranch('user', 'repo', 'feature', 'abc123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/repo/git/refs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            ref: 'refs/heads/feature',
            sha: 'abc123',
          }),
        })
      );
    });
  });

  describe('getLatestCommitSha', () => {
    it('should get latest commit SHA for branch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ref: 'refs/heads/main',
          object: { sha: 'def456' },
        }),
      });

      const sha = await client.getLatestCommitSha('user', 'repo', 'main');

      expect(sha).toBe('def456');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/repo/git/ref/heads/main',
        expect.any(Object)
      );
    });
  });

  describe('createOrUpdateFile', () => {
    it('should create new file', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: { sha: 'ghi789' } }),
      });

      await client.createOrUpdateFile(
        'user',
        'repo',
        'path/to/file.txt',
        'file content',
        'Create file',
        'main'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/repo/contents/path/to/file.txt',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"message":"Create file"'),
        })
      );
    });

    it('should update existing file with SHA', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: { sha: 'new789' } }),
      });

      await client.createOrUpdateFile(
        'user',
        'repo',
        'file.txt',
        'updated content',
        'Update file',
        'main',
        'old123'
      );

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.sha).toBe('old123');
    });

    it('should base64 encode file content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await client.createOrUpdateFile(
        'user',
        'repo',
        'file.txt',
        'hello world',
        'msg',
        'main'
      );

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.content).toBe(
        Buffer.from('hello world').toString('base64')
      );
    });
  });

  describe('createPullRequest', () => {
    it('should create PR with multiple files', async () => {
      const mockPR = {
        number: 42,
        html_url: 'https://github.com/user/repo/pull/42',
        title: 'Setup ZeroKeyCI',
        state: 'open',
        created_at: '2025-10-18T00:00:00Z',
      };

      global.fetch = vi
        .fn()
        // getLatestCommitSha
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ object: { sha: 'base123' } }),
        })
        // createBranch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        // createOrUpdateFile (file 1)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        // createOrUpdateFile (file 2)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        // createPullRequest
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPR,
        });

      const pr = await client.createPullRequest({
        owner: 'user',
        repo: 'repo',
        title: 'Setup ZeroKeyCI',
        body: 'This PR sets up ZeroKeyCI',
        head: 'zerokey-setup',
        base: 'main',
        files: [
          { path: '.github/workflows/deploy.yml', content: 'workflow content' },
          { path: '.zerokey/deploy.yaml', content: 'config content' },
        ],
      });

      expect(pr).toEqual(mockPR);
      expect(pr.number).toBe(42);
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    it('should handle PR creation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => 'Branch already exists',
      });

      await expect(
        client.createPullRequest({
          owner: 'user',
          repo: 'repo',
          title: 'Test',
          body: 'Body',
          head: 'test',
          base: 'main',
          files: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'file', content: 'base64content' }),
      });

      const exists = await client.fileExists('user', 'repo', 'README.md');

      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });

      const exists = await client.fileExists('user', 'repo', 'nonexistent.txt');

      expect(exists).toBe(false);
    });

    it('should support ref parameter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await client.fileExists('user', 'repo', 'file.txt', 'develop');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?ref=develop'),
        expect.any(Object)
      );
    });

    it('should throw error for non-404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
      });

      await expect(
        client.fileExists('user', 'repo', 'file.txt')
      ).rejects.toThrow('GitHub API error');
    });
  });
});
