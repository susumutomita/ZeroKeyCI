# Claude Agent Playbook
Follow this checklist when you modify ZeroKey CI. The priority is to operate from constraints: living exec plans, green tests, clear documentation.

## ⚠️  CRITICAL: Core Value Propositions (NEVER DEVIATE)

ZeroKeyCI has **TWO core value propositions** that must NEVER be compromised:

### 1. No Private Keys in CI/CD (Security Innovation)

**THE PRIMARY VALUE**: Deploy smart contracts WITHOUT storing private keys in GitHub Actions.

```yaml
# ❌ NEVER THIS (traditional approach):
env:
  PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}  # SECURITY RISK

# ✅ ALWAYS THIS (ZeroKeyCI approach):
env:
  SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}  # NO PRIVATE KEYS
```

**Core workflow:**
1. CI generates **unsigned** Safe transaction proposals (no private keys needed)
2. Safe owners review and approve via multisig (using their own keys)
3. Contract deploys after threshold signatures

**If private keys are introduced to CI/CD at any point, the entire value proposition is destroyed.**

### 2. ETHOnline 2025 Hackathon Prize Coverage

**⚠️ CRITICAL: ALWAYS verify prizes at official page**: https://ethglobal.com/events/ethonline2025/prizes

**See `docs/ETHONLINE2025_PRIZES.md` for complete verified sponsor list and analysis.**

**VERIFIED Prize Targets** (actual sponsors with actual code integration):

#### ✅ Lit Protocol ($5,000)
- **Status**: Implemented - CORE FEATURE
- **Evidence**: PKP-based automated signing for keyless CI/CD
- **Files**:
  - `scripts/trigger-pkp-signing.ts` (163 lines)
  - `docs/PKP_SETUP.md` (complete setup guide)
  - `.github/workflows/deploy.yml` lines 226-250 (PKP workflow)
  - Environment vars: `PKP_PUBLIC_KEY`, `LIT_ACTION_IPFS_CID`, `LIT_NETWORK`
- **Prize track**: Lit Protocol - Programmable Key Pairs
- **Why strong fit**: PKPs are fundamental to keyless CI/CD architecture

#### ✅ Hardhat ($5,000)
- **Status**: Implemented - CORE DEPENDENCY
- **Evidence**: All smart contract development using Hardhat 3.0.7
- **Files**:
  - `hardhat.config.ts` (complete configuration)
  - `package.json`: `"hardhat": "^3.0.7"`
  - All contract compilation, testing, deployment via Hardhat
  - 605 tests running with Hardhat infrastructure
- **Prize track**: Hardhat - Development Environment
- **Why strong fit**: Essential tool powering entire smart contract workflow

#### ✅ Blockscout ($10,000)
- **Status**: Implemented - FEATURE INTEGRATION
- **Evidence**: Automated contract verification + MCP integration
- **Files**:
  - `scripts/blockscout-verify.ts` (contract verification)
  - `.github/workflows/deploy.yml` lines 183-195 (verification step)
  - `.github/workflows/deploy.yml` lines 197-224 (MCP server integration)
- **Prize track**: Blockscout - Contract Verification & Explorer
- **Why strong fit**: Automated verification in CI/CD workflow

**⚠️ DO NOT CLAIM PRIZES THAT DON'T EXIST:**
- ❌ "Safe (Gnosis Safe)" - NO PRIZE SPONSOR (we use Safe, but no prize for it)
- ❌ "Security/Infrastructure" - DOES NOT EXIST as prize category
- ❌ "Developer Tools" - DOES NOT EXIST as prize category
- ❌ "Best Overall" - DOES NOT EXIST in sponsor list

**IMPORTANT**: Prize claims MUST be:
1. Actually verified sponsors (check https://ethglobal.com/events/ethonline2025/prizes)
2. Actually implemented (not just mentioned in docs)
3. Demonstrated in working code with file paths
4. Verifiable evidence of integration

**If you make up prize sponsors or categories, the submission loses credibility.**

### How to Maintain These Core Values

**Before any code change:**
1. ✅ Does this maintain "no private keys in CI/CD"?
2. ✅ Does this support all 4 prize track integrations?
3. ✅ Is this aligned with the ETHOnline 2025 submission?

**Red flags (STOP IMMEDIATELY):**
- ❌ Adding `PRIVATE_KEY` environment variable to CI
- ❌ Removing or breaking Hardhat/Blockscout/Lit/Envio integration
- ❌ Auto-signing in CI without Safe multisig approval
- ❌ Simplifying away the security model

**When in doubt**: Read README.md sections on "Key Innovation" and "Hackathon Relevance"

## Exec Plan Ceremony
1. Before touching code, open or create the relevant section in `plans.md` using the provided template and the phrase “exec plan”.
2. Log objective, guardrails, ordered TODOs, validation steps, and open questions. Append updates with timestamps; never delete history.
3. After each meaningful change, record what was done, which checks passed, and decisions made. Reference the exec plan in commit bodies and PR descriptions.

## Development Loop
- **ALWAYS check `package.json` for the `packageManager` field before running any package installation commands.** If `packageManager` specifies `bun`, use `bun` commands. Never use `npm` if `bun` is specified.
- Use `bun run test:watch` while iterating; keep the red-to-green cycle short.
- Once changes stabilize, run `bun run test`, `bun run test:coverage`, and `make before_commit`. Stop immediately if any command fails and update the exec plan with the blocker.
- Prefer incremental commits tied to individual TODO items from the plan.

## Documentation Duties
- Update `AGENTS.md` when introducing new automation, validation scripts, or workflow expectations so future agents inherit the context.
- If behaviour changes or manual steps are added, extend the relevant section of `README.md` and note the update inside the exec plan.
- Capture artefacts (screenshots, logs) referenced in PRs; store their locations in `plans.md` for auditability.

## Autonomous Development Flow (Default Mode)
When the user says「自律的に動いて」or indicates they want autonomous development, switch to the autonomous flow。

1. **Analyze & Plan**
   - Identify next logical feature from README, existing code, or project architecture
   - Create exec plan in `plans.md` with clear objective and guardrails
   - Use TodoWrite to track all implementation steps

2. **Implement**
   - Write code following test-first approach
   - Update plans.md progress log after each iteration
   - Keep commits focused on single concerns

3. **Validate**
   - Run all validation checks before committing:
     - `bun run lint_text` (markdown)
     - `bun run lint` (code)
     - `bun run typecheck` (TypeScript)
     - `bun run test` (unit tests)
     - `bun run build` (Next.js build)
     - `npx hardhat compile` (contracts, if applicable)
   - If any check fails, fix immediately or document blocker in plans.md

4. **Git Workflow**
   - Create feature branch: `git checkout -b feat/descriptive-name`
   - Stage only relevant files: `git add [files]`
   - Commit with conventional format:
     ```
     feat: brief description

     - Bullet point changes
     - Technical decisions
     - Current status

     Refs: plans.md "Exec Plan Name"

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```
   - Push: `git push -u origin feat/branch-name`

5. **Pull Request**
   - Create PR with comprehensive description:
     - Summary of changes
     - What's changed (checklist)
     - Technical decisions
     - Test coverage
     - Known issues (if any)
     - Next steps
   - Include verification evidence (compile output, test results)
   - Link to exec plan in plans.md

6. **CI Verification** (CRITICAL - ALWAYS DO THIS)
   - After PR creation, IMMEDIATELY check CI status
   - Wait for GitHub Actions to start (usually 5-10 seconds)
   - Use `gh pr checks [PR_NUMBER]` or check PR status
   - If CI fails:
     - Get logs: `gh run view [RUN_ID] --log-failed`
     - Fix issues in the same branch
     - Commit and push fixes
     - Verify CI passes before notifying user
   - Only report PR as "ready" when CI is GREEN

7. **Report to User**
   - Provide PR URL
   - Confirm CI status (passing/failing with details)
   - Note: User will merge when ready

## CI Verification Protocol
**NEVER skip this step after creating a PR**

```bash
# Method 1: Using gh CLI (preferred)
gh pr checks <PR_NUMBER>

# Method 2: Check workflow runs
gh run list --branch <branch-name> --limit 1

# If failed, get logs
gh run view <RUN_ID> --log-failed

# Monitor until completion (if still running)
gh run watch <RUN_ID>
```

If CI fails:
1. Analyze failure logs
2. Fix in same branch (don't create new PR)
3. Commit with: `fix: resolve CI issue - [description]`
4. Push and re-verify
5. Repeat until GREEN

## Self-Review Protocol
**ALWAYS perform self-review before reporting PR as ready**

Use GitHub CLI to review your own changes:
```bash
# View PR diff
gh pr diff <PR_NUMBER>

# Or use the review command if available
gh pr review <PR_NUMBER> --comment
```

Self-review checklist:
- [ ] Code follows project style and conventions
- [ ] All validation checks pass (`make before_commit` + CI)
- [ ] No commented-out code or debug statements
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] Exec plan accurately reflects what was implemented
- [ ] Commit message clearly explains changes

## Retrospective & Prevention Protocol
**Every problem MUST trigger a retrospective and prevention措置**

When issues occur (CI failures, bugs, mistakes):

1. **Document in plans.md immediately**
   ```markdown
   **Problem**: [What went wrong]
   **Root Cause**: [Why it happened]
   **Prevention**: [How to avoid in future]
   ```

2. **Update documentation to prevent recurrence**
   - Add to CLAUDE.md if it's a workflow issue
   - Add to AGENTS.md if agents should know
   - Update README if user-facing

3. **Add automated checks if possible**
   - New validation in `make before_commit`
   - New CI step
   - Pre-commit hook

Example retrospective entry:
```markdown
##### Problem
Created PR #5 without checking CI, leading to failed tests discovery late.

##### Root Cause
No documented workflow step requiring CI verification after PR creation.

##### Prevention
- Added "CI Verification" as step 6 in Autonomous Development Flow
- Made it CRITICAL with explicit commands
- Added to AGENTS.md as mandatory protocol
```

## Hackathon Documentation Guidelines (ETHOnline 2025)

**Official page**: https://ethglobal.com/events/ethonline2025/info/details

### General Judging Criteria (ETHGlobal Standard)

Judges evaluate projects on:
1. **Creativity & Innovation** - Is this a novel approach? Does it solve the problem in a unique way?
2. **Technical Difficulty** - What's the complexity of implementation? Did you tackle hard problems?
3. **Functionality & Completeness** - Does it work? Is it production-ready or a proof-of-concept?
4. **Real-World Impact** - Will people actually use this? Does it solve a real problem?
5. **Sponsor Tech Integration** - How well are sponsor technologies integrated? (Depth > breadth)

### Submission Requirements

**REQUIRED for all submissions:**
- **Demo video** (2-4 minutes) - Must showcase the project working
- **GitHub repo** - Must prove work done during hackathon
  - Clear commit history showing hackathon timeline
  - Distinguish between new code and reused libraries
- **Submission deadline**: Sunday, October 26th 2025 at 12:00 pm EDT

### README Optimization for Hackathon Judges

**Core principle**: Judges have **5 minutes maximum** to understand your project.

**MUST HAVE sections (in this order):**
1. **What Makes This Different** (30 seconds read)
   - Clear problem statement
   - Your unique solution
   - Why it's better than alternatives

2. **Real-World Impact** (1 minute read)
   - **OUTCOMES, not metrics**
   - Specific numbers: "$177 saved", "10x faster", "2-of-3 vs 1 account"
   - Before/After comparisons

3. **Sponsor Tech Integration** (1 minute read)
   - List ALL sponsor technologies used
   - Show DEPTH of integration (file paths, line numbers)
   - Explain WHY each tech was chosen

4. **What We Built** (2 minutes read)
   - 5-7 key features with tangible outcomes
   - Concrete examples for each feature

**AVOID in hackathon README:**
- ❌ Test coverage percentages (judges don't care)
- ❌ File counts, line counts (not outcomes)
- ❌ Future plans (judges evaluate current state)
- ❌ Long technical architecture diagrams (judges skip these)

**User feedback from ETHOnline 2025 prep:**
> "こんなのなんの価値もないアウトカムがすべて"
> (Translation: "This has no value, outcomes are everything")

**Key lesson**: Show OUTCOMES (money saved, time saved, security improved), not METRICS (tests passing, coverage ％).

### Judging Process

1. **Round 1**: Asynchronous judging of all submissions
2. **Round 2**: Live judging of top 20％ projects
3. **Criteria**: Same for both rounds

**Judge perspective**: They review 100+ projects. Make it EASY to understand your value in 5 minutes.

## Handoff Protocol
- Summarise the final state in `plans.md`: shipped work, outstanding risks, follow-ups, and the latest test status.
- Ensure the PR description links the exec plan, lists verification evidence, and names required reviewers for signing, policy, or deployment changes.
- Confirm CI is passing before notifying user
- Complete self-review checklist before requesting human review
- Request human review only after `make before_commit` passes, CI is green, self-review is complete, and the exec plan reflects the current state.
