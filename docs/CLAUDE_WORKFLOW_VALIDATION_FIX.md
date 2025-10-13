# Claude Workflow Validation Fix (Issue #11)

## Problem
The current Claude workflows (`claude.yml` and `claude-code-review.yml`) do not run validation checks after Claude Code completes. This means Claude can create code with lint/type/test errors and the workflow will still mark as successful.

## Solution
Add validation steps AFTER Claude Code runs to ensure all changes pass `make before-commit` checks.

## Required Changes

### 1. Update `.github/workflows/claude.yml`

Add these steps AFTER the "Run Claude Code" step (line 33-42):

```yaml
      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}

          # This is an optional setting that allows Claude to read CI results on PRs
          additional_permissions: |
            actions: read

      # ADD THESE VALIDATION STEPS AFTER CLAUDE CODE:

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run validation checks
        id: validation
        run: |
          echo "🔍 Running validation checks..."
          echo "================================"

          # Run each check individually to see which ones fail
          echo "📝 Checking markdown..."
          bun run lint_text || true

          echo "🔧 Checking code lint..."
          bun run lint || true

          echo "🎯 Checking TypeScript..."
          bun run typecheck || true

          echo "✨ Checking format..."
          bun run format_check || true

          echo "🏗️ Building project..."
          bun run build || true

          echo "🧪 Running tests with coverage..."
          bun run test:coverage || true

          echo "================================"
          echo "🎯 Running full validation..."
          make before_commit
```

### 2. Update `.github/workflows/claude-code-review.yml`

Add the same validation steps AFTER the "Run Claude Code Review" step (after line 56):

```yaml
      - name: Run Claude Code Review
        id: claude-review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            # ... existing prompt ...
          claude_args: '--allowed-tools "..."'

      # ADD THESE VALIDATION STEPS AFTER CLAUDE CODE:

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run validation checks
        id: validation
        run: |
          echo "🔍 Running validation checks..."
          echo "================================"

          # Run each check individually to see which ones fail
          echo "📝 Checking markdown..."
          bun run lint_text || true

          echo "🔧 Checking code lint..."
          bun run lint || true

          echo "🎯 Checking TypeScript..."
          bun run typecheck || true

          echo "✨ Checking format..."
          bun run format_check || true

          echo "🏗️ Building project..."
          bun run build || true

          echo "🧪 Running tests with coverage..."
          bun run test:coverage || true

          echo "================================"
          echo "🎯 Running full validation..."
          make before_commit
```

## Important Notes

1. **Order Matters**: The validation MUST run AFTER Claude Code, not before.
   - Correct: Claude runs → validation checks Claude's changes
   - Wrong: Validation runs → Claude runs (checks old code, not new)

2. **Fail on Error**: The final `make before_commit` does NOT have `|| true`, so it will fail the workflow if validation fails.

3. **Individual Checks**: We run each check with `|| true` first to see all failures in the logs, then run the full validation.

## Testing the Fix

After applying these changes:

1. Create a test issue mentioning @claude
2. Let Claude make code changes
3. Verify the validation steps run AFTER Claude
4. Check that workflow fails if validation fails

## Migration Steps

1. **Manual Update Required** (GitHub App cannot modify workflows):
   ```bash
   # Edit the files manually
   vi .github/workflows/claude.yml
   vi .github/workflows/claude-code-review.yml
   ```

2. **Apply the changes** shown above

3. **Commit and push**:
   ```bash
   git add .github/workflows/
   git commit -m "fix: add validation checks after Claude Code runs (Issue #11)"
   git push
   ```

4. **Test with a new issue** to verify it works

## Rollback Plan

If issues occur, revert to the previous version:
```bash
git revert HEAD
git push
```

## Why This Fix Works

1. **Ensures Quality**: Claude's changes are validated before marking task complete
2. **Catches Errors**: Lint, type, and test errors will fail the workflow
3. **Provides Feedback**: Individual check output helps debug failures
4. **Maintains Standards**: Enforces the same `make before_commit` used locally

## Related Files
- `.github/workflows/claude.yml`
- `.github/workflows/claude-code-review.yml`
- `Makefile` (defines `before_commit` target)
- Issue #11: "claude.yaml claude-core-review.yml の完了条件に make before-commit を追加する"