# Claude Agent Playbook
Follow this checklist when you modify ZeroKey CI. The priority is to operate from constraints: living exec plans, green tests, clear documentation.

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

## Handoff Protocol
- Summarise the final state in `plans.md`: shipped work, outstanding risks, follow-ups, and the latest test status.
- Ensure the PR description links the exec plan, lists verification evidence, and names required reviewers for signing, policy, or deployment changes.
- Confirm CI is passing before notifying user
- Complete self-review checklist before requesting human review
- Request human review only after `make before_commit` passes, CI is green, self-review is complete, and the exec plan reflects the current state.
