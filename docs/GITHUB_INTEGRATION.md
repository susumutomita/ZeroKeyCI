# GitHub Integration Guide

Complete guide for setting up and using ZeroKeyCI's one-click GitHub integration.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [GitHub OAuth App Setup](#github-oauth-app-setup)
- [User Flow](#user-flow)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Advanced Topics](#advanced-topics)

## Overview

ZeroKeyCI's GitHub integration allows users to set up automated contract deployment in just 3 minutes with a single click. The integration:

- **Authenticates** users via GitHub OAuth
- **Lists** repositories where the user has admin permissions
- **Creates** a pull request with all necessary configuration files
- **No manual file copying** required

### What Gets Created

When you connect a repository, ZeroKeyCI automatically creates a PR containing:

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - Automated deployment pipeline
   - Safe multisig integration
   - OPA policy validation

2. **Deployment Configuration** (`.zerokey/deploy.yaml`)
   - Network and contract settings
   - Gas configuration
   - Safe signer addresses

3. **OPA Policy** (`.zerokey/policy.rego`)
   - Security validation rules
   - Network restrictions
   - Gas limit checks

## Quick Start

### For Users

1. Visit [ZeroKeyCI Setup](https://zero-key-ci.vercel.app/setup)
2. Click **"Get Started Now"**
3. Click **"Connect with GitHub"**
4. Authorize the application
5. Select your repository
6. Click **"Setup ZeroKeyCI"**
7. Review and merge the created PR
8. Configure GitHub Secrets (see PR description)
9. Start deploying! 🚀

**Total time: ~3 minutes**

### For Developers/Self-Hosting

If you're running ZeroKeyCI locally or self-hosting, you'll need to set up a GitHub OAuth App first.

## GitHub OAuth App Setup

### Step 1: Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:

   | Field | Value |
   |-------|-------|
   | **Application name** | `ZeroKeyCI (Local)` or your preferred name |
   | **Homepage URL** | `http://localhost:3000` (or your deployment URL) |
   | **Authorization callback URL** | `http://localhost:3000/api/auth/github/callback` |
   | **Application description** | Optional description |

4. Click **"Register application"**

### Step 2: Get Credentials

After creating the app:

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again)

### Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

**Important:**
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are server-side only
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` is exposed to the browser (safe)
- Never commit `.env.local` to version control

### Step 4: Start Development Server

```bash
bun install
bun run dev
```

Visit `http://localhost:3000` and test the integration!

## User Flow

### 1. Landing Page

User arrives at the ZeroKeyCI landing page and clicks **"Get Started Now"**.

### 2. OAuth Authorization

- User is redirected to `/setup` page
- Clicks **"Connect with GitHub"**
- Redirected to GitHub OAuth authorization page
- GitHub asks user to authorize ZeroKeyCI

**Permissions requested:**
- `repo` - Read and write access to repositories (to create PRs)
- `read:user` - Read user profile information
- `user:email` - Read user email addresses

### 3. Repository Selection

After authorization:
- User is redirected back to `/setup` page
- Authenticated user info is displayed
- Repository list is loaded (only repos with admin permissions)
- User selects a repository from dropdown

**Why admin permissions?**
- Need admin access to create branches
- Need admin access to create pull requests
- Ensures user has permission to configure CI/CD

### 4. PR Creation

When user clicks **"Setup ZeroKeyCI"**:
1. Creates new branch `zerokey-ci-setup`
2. Commits three template files:
   - `.github/workflows/deploy.yml`
   - `.zerokey/deploy.yaml`
   - `.zerokey/policy.rego`
3. Creates pull request with comprehensive description
4. Shows success message with PR link

### 5. Configuration

User reviews the PR and:
1. Configures GitHub Secrets (instructions in PR)
2. Merges the PR
3. ZeroKeyCI is now active!

## Configuration

### GitHub Secrets Required

After merging the setup PR, configure these secrets in your repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SAFE_ADDRESS` | Your Gnosis Safe address | `0x1234...5678` |
| `SEPOLIA_RPC_URL` | RPC endpoint for Sepolia | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` |

**Network-specific RPC URLs:**
- For Sepolia: `SEPOLIA_RPC_URL`
- For Mainnet: `MAINNET_RPC_URL`
- For Polygon: `POLYGON_RPC_URL`
- For Arbitrum: `ARBITRUM_RPC_URL`
- For Optimism: `OPTIMISM_RPC_URL`
- For Base: `BASE_RPC_URL`

See [docs/GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for detailed instructions.

### Deployment Configuration

Edit `.zerokey/deploy.yaml` in your repository:

```yaml
# Network to deploy to
network: base-sepolia

# Contract name (must match Solidity file)
contract: YourContract

# Constructor arguments (if any)
constructorArgs: []

# ETH value to send (in wei)
value: "0"

# Gas configuration
gasLimit: 5000000
gasPrice: "20000000000"

# Safe multisig configuration
signers:
  threshold: 2
  addresses:
    - "0xYourSafeAddress"
```

### OPA Policy Customization

Edit `.zerokey/policy.rego` to customize validation rules:

```rego
package deployment

# Minimum number of signers required
min_signers := 2

# Allowed networks for deployment
allowed_networks := ["sepolia", "mainnet", "polygon"]

# Maximum gas limit (prevents expensive mistakes)
max_gas_limit := 10000000

# Validation rules
default allow = false

allow {
  valid_network
  valid_signers
  valid_gas_limit
}

valid_network { input.network == allowed_networks[_] }
valid_signers { input.signers.threshold >= min_signers }
valid_gas_limit { input.gasLimit <= max_gas_limit }
```

## Troubleshooting

### Common Issues

#### 1. "Not authenticated" Error

**Problem:** User sees "Not authenticated" error when trying to list repositories.

**Causes:**
- OAuth token expired (24-hour lifetime)
- Cookie blocked by browser
- Token not set correctly

**Solution:**
1. Clear browser Cookie for the site
2. Try authentication flow again
3. Check browser console for Cookie errors
4. Ensure Cookie are enabled in browser settings

#### 2. "No repositories found"

**Problem:** Repository dropdown is empty after authentication.

**Causes:**
- User has no repositories with admin permissions
- GitHub API rate limit exceeded
- Repositories are owned by organizations without admin access

**Solution:**
1. Create a new repository on GitHub
2. Ensure you have admin access to at least one repository
3. Check organization settings if using org repositories
4. Wait if rate limited (60 requests/hour for unauthenticated, 5000/hour for authenticated)

#### 3. "Failed to create PR"

**Problem:** PR creation fails with error message.

**Causes:**
- Repository already has ZeroKeyCI configured (409 error)
- Network/API errors
- Insufficient permissions

**Solution:**
- **If 409 error:** Repository already has `.github/workflows/deploy.yml` - ZeroKeyCI is already set up!
- **If network error:** Retry after a few moments
- **If permission error:** Ensure you have admin access to the repository

#### 4. OAuth Callback Error

**Problem:** Error after GitHub authorization redirect.

**Causes:**
- Invalid `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET`
- Callback URL mismatch
- OAuth App not configured correctly

**Solution:**
1. Verify environment variables in `.env.local`
2. Check OAuth App callback URL matches exactly: `http://localhost:3000/api/auth/github/callback`
3. Regenerate client secret if needed
4. Ensure OAuth App is not suspended

#### 5. "Configuration error"

**Problem:** Generic configuration error during OAuth flow.

**Causes:**
- Missing `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` environment variables
- Environment variables not loaded

**Solution:**
1. Check `.env.local` file exists
2. Verify all required environment variables are set
3. Restart development server (`bun run dev`)
4. Check for typos in variable names

### Debugging Tips

#### Enable Debug Logging

The application logs detailed information to the console. Check:

**Browser Console (F12):**
- Network tab for failed API requests
- Console tab for JavaScript errors
- Application tab for cookies

**Server Logs:**
- Check terminal where `bun run dev` is running
- Look for `[DEBUG]`, `[INFO]`, `[WARN]`, `[ERROR]` messages

#### Test GitHub API Connection

You can test if your OAuth credentials work:

```bash
curl -X POST https://github.com/login/oauth/access_token \
  -H "Accept: application/json" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=TEMPORARY_CODE_FROM_OAUTH"
```

#### Check Repository Permissions

Verify you have admin access:

```bash
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO
```

Look for `"permissions": { "admin": true }` in the response.

## Security Considerations

### Token Storage

**How tokens are stored:**
- Access tokens stored in **HTTP-only cookies**
- 24-hour expiration (tokens auto-expire)
- `sameSite=lax` for CSRF protection
- `secure` flag in production (HTTPS only)

**Why HTTP-only cookies?**
- Cannot be accessed by JavaScript (prevents XSS attacks)
- Automatically included in requests
- More secure than localStorage

### CSRF Protection

**State Parameter:**
- Random state generated during OAuth flow
- Stored in sessionStorage
- Verified on callback (future enhancement)

**Current implementation:**
- State parameter generated but not yet validated
- TODO: Add state validation in callback endpoint

### Rate Limiting

GitHub API has rate limits:
- **Unauthenticated:** 60 requests/hour
- **Authenticated:** 5,000 requests/hour

ZeroKeyCI uses authenticated requests (via access token) for higher limits.

**Handling rate limits:**
- Application shows user-friendly error if rate limited
- Retry after waiting period
- Consider implementing client-side caching

### Permissions Scope

**Requested scopes:**
- `repo` - Full control of repositories
- `read:user` - Read user profile
- `user:email` - Read email addresses

**Why `repo` scope?**
- Need to create branches
- Need to create pull requests
- Need to commit files

**Alternative:** Could use GitHub Apps with fine-grained permissions (future enhancement)

### Secret Management

**Never commit:**
- `GITHUB_CLIENT_SECRET` (server-side secret)
- `.env.local` file
- Access tokens

**Safe to commit:**
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` (public identifier)
- `.env.example` (template without real values)

## Advanced Topics

### Using GitHub Apps Instead of OAuth Apps

**GitHub Apps vs OAuth Apps:**

| Feature | OAuth Apps | GitHub Apps |
|---------|-----------|-------------|
| Installation | User-level | Org/repo-level |
| Permissions | Broad scopes | Fine-grained |
| API Rate Limit | 5,000/hour | 15,000/hour |
| Webhooks | Not included | Built-in |
| Complexity | Simple | More complex |

**When to use GitHub Apps:**
- Enterprise deployments
- Need webhooks for real-time updates
- Want fine-grained permissions
- Higher rate limits required

**Migration path:**
1. Create GitHub App
2. Implement JWT-based authentication
3. Update GitHubClient to support both OAuth and App authentication
4. Add installation flow

### Custom Templates

You can customize the generated files by modifying the templates in:
- `src/app/api/github/setup-pr/route.ts`

**Example: Custom workflow template**

```typescript
const WORKFLOW_TEMPLATE = `name: Deploy Smart Contract (Custom)

on:
  workflow_dispatch:  # Manual trigger instead of PR merge
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... rest of workflow
`;
```

### Webhook Integration (Future)

To get real-time updates when PRs are merged:

1. Set up GitHub webhook in OAuth App settings
2. Add webhook endpoint to Next.js API routes
3. Verify webhook signature
4. Process deployment events

**Example webhook endpoint:**

```typescript
// src/app/api/webhooks/github/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256');
  const payload = await request.text();

  // Verify signature
  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  // Handle pull_request merged event
  if (event.action === 'closed' && event.pull_request.merged) {
    // Trigger deployment workflow
  }

  return NextResponse.json({ success: true });
}
```

### Multi-Repository Setup

To set up ZeroKeyCI in multiple repositories:

1. Use the `/setup` flow for each repository
2. Each repository gets its own PR
3. Each repository needs its own GitHub Secrets configured

**Bulk setup (future enhancement):**
- Select multiple repositories at once
- Create PRs in parallel
- Unified configuration management

### Integration with GitHub Actions

The generated workflow integrates seamlessly with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Create Safe Proposal
  run: bun run scripts/create-safe-proposal.ts
  env:
    SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
    SEPOLIA_RPC_URL: ${{ secrets.SEPOLIA_RPC_URL }}
```

**Environment variables in Actions:**
- Secrets are encrypted and never logged
- Available only to workflow runs
- Can be scoped to specific environments

## Support

### Documentation

- [Main README](../README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [GitHub Secrets Setup](./GITHUB_SECRETS.md)
- [Security Architecture](./SECURITY.md)

### Community

- GitHub Issues: [Report a bug](https://github.com/susumutomita/ZeroKeyCI/issues)
- GitHub Discussions: [Ask questions](https://github.com/susumutomita/ZeroKeyCI/discussions)

### Contributing

Contributions welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

**Need help?** Open an issue on [GitHub](https://github.com/susumutomita/ZeroKeyCI/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS information
