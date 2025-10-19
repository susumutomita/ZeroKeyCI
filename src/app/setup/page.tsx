'use client';

import { useState, useEffect } from 'react';
import { Github, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
}

interface Repository {
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

export default function SetupPage() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [prUrl, setPrUrl] = useState<string>('');
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [callbackUrl, setCallbackUrl] = useState('');

  // Check OAuth configuration on mount
  useEffect(() => {
    // Set callback URL for SSR compatibility
    setCallbackUrl(`${window.location.origin}/api/auth/github/callback`);

    fetch('/api/config/status')
      .then((res) => res.json())
      .then((data) => {
        setOauthConfigured(data.features.githubOAuthEnabled);
      })
      .catch((err) => {
        console.error('Failed to check config status:', err);
        setOauthConfigured(false);
      });
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authenticated = params.get('authenticated');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(
        `Authentication failed: ${params.get('error_description') || errorParam}`
      );
    }

    if (authenticated === 'true') {
      loadUserAndRepositories();
    }
  }, []);

  const loadUserAndRepositories = async () => {
    try {
      setLoading(true);

      // Get user info from cookie (set by OAuth callback)
      const userCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('github_user='));

      if (userCookie) {
        const userData = JSON.parse(
          decodeURIComponent(userCookie.split('=')[1])
        );
        setUser(userData);
      }

      // Fetch repositories
      const response = await fetch('/api/github/repositories');
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      setRepositories(repos);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGitHub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError('GitHub OAuth is not configured');
      return;
    }

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('github_oauth_state', state);

    // Redirect to GitHub OAuth
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scopes = 'repo,read:user,user:email';

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}`;
  };

  const handleSetupZeroKeyCI = async () => {
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [owner, repo] = selectedRepo.split('/');

      // Create PR with ZeroKeyCI setup
      const response = await fetch('/api/github/setup-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PR');
      }

      const data = await response.json();
      setPrUrl(data.pr_url);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Back to Home Link */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">←</span>
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Pull Request Created! 🎉
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              ZeroKeyCI has been set up in your repository. Review and merge the
              PR to start deploying.
            </p>

            <div className="space-y-4">
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                <ExternalLink className="w-5 h-5" />
                View Pull Request
              </a>
            </div>

            <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
              <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
              <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                <li>Review the PR to understand the changes</li>
                <li>Configure GitHub Secrets (see PR description)</li>
                <li>Merge the PR</li>
                <li>Start deploying contracts with ZeroKeyCI! 🚀</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-2xl">←</span>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            Setup ZeroKeyCI
          </h1>
          <p className="text-xl text-gray-300">
            Connect your GitHub account and deploy contracts in 3 minutes
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300 mb-1">Error</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Connect GitHub */}
        {!user && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                1
              </div>
              <h2 className="text-2xl font-bold text-white">
                Connect to GitHub
              </h2>
            </div>

            {oauthConfigured === false ? (
              // Show user-friendly message when OAuth is not configured
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <h3 className="font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    One-Click Setup Not Available
                  </h3>
                  <p className="text-yellow-200 mb-4">
                    The one-click GitHub integration is not configured on this
                    instance. You can still deploy contracts using the manual
                    setup method below.
                  </p>

                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-300">
                      <strong>For users:</strong> Use the manual setup guide to
                      add ZeroKeyCI to your repository without OAuth.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      <strong>For administrators:</strong> This instance
                      requires GitHub OAuth configuration. See{' '}
                      <a
                        href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/GITHUB_INTEGRATION.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        GitHub Integration Guide
                      </a>{' '}
                      for setup instructions.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-300 mb-3">
                    Manual Setup (Recommended)
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Add ZeroKeyCI to your repository by manually creating the
                    workflow files. This method works for all projects and does
                    not require OAuth.
                  </p>
                  <a
                    href="https://github.com/susumutomita/ZeroKeyCI/blob/main/docs/DEPLOYMENT_GUIDE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Manual Setup Guide
                  </a>
                </div>
              </div>
            ) : oauthConfigured === true ? (
              // Show connect button when OAuth is configured
              <>
                <p className="text-gray-300 mb-6">
                  Authorize ZeroKeyCI to access your repositories. We need
                  permission to create a pull request with the deployment
                  workflow.
                </p>

                <button
                  onClick={handleConnectGitHub}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <Github className="w-5 h-5" />
                  Connect with GitHub
                </button>
              </>
            ) : (
              // Loading state
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 mt-4">Checking configuration...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Repository */}
        {user && !success && (
          <>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connected</h2>
                  <p className="text-gray-400">Logged in as @{user.login}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                  2
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Select Repository
                </h2>
              </div>

              <p className="text-gray-300 mb-6">
                Choose the repository where you want to deploy smart contracts.
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 mt-4">Loading repositories...</p>
                </div>
              ) : repositories.length > 0 ? (
                <>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select a repository...</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                        {repo.private ? ' (Private)' : ' (Public)'}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleSetupZeroKeyCI}
                    disabled={!selectedRepo || loading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Setup ZeroKeyCI
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No repositories found. Create a repository on GitHub first.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
