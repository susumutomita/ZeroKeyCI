# Repository Guidelines
ZeroKey CI pairs Next.js 15, Bun, and Vitest. Every change must stay test-first and doc-driven so agents can execute end to end without supervision.

## Agent Execution Protocol
- Read `CLAUDE.md` before edits; start an exec plan in `plans.md` for multi-step work and keep scope, TODOs, and decisions current.
- Never ship while tests are red; run `bun run test` or `bun run test:watch` after each commit-ready change.
- Capture new validation scripts, snapshot helpers, or manual verification steps inside `plans.md` so the loop stays reproducible.
- Log blockers or required human follow-up in the PR body whenever automation cannot resolve them.

## Project Structure & Module Organization
- `src/app/` holds App Router entries plus shared styles in `globals.css`.
- `src/__tests__/` contains Vitest suites; co-locate feature checks as `*.test.ts(x)` when proximity helps.
- `public/` serves static assets for dashboards and marketing captures.
- Root configs (`next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `vitest.setup.ts`) define build, styling, and test rules; import via the `@` alias from `tsconfig.json`.

## Build, Test, and Development Commands
- `bun install` (CI uses `bun run install:ci`) restores dependencies.
- `bun run dev` or `make dev` launches the app on http://localhost:3000.
- `bun run build` / `make build` produces the production artefact; `bun run start` serves it locally.
- Quality gates: `bun run lint`, `bun run typecheck`, `bun run format_check`, and `make before_commit`.

## Coding Style & Naming Conventions
- Prettier enforces two-space indentation and single quotes; run `bun run format` before review.
- Components use PascalCase, hooks/utilities camelCase, directories under `src/app` kebab-case.
- Compose Tailwind classes layout → spacing → typography and rely on `clsx` + `tailwind-merge` for conditional styling.

## Testing Guidelines
- Vitest with globals and hooks in `vitest.setup.ts`; default command is `bun run test`.
- Coverage gates lock at 100% across statements, branches, functions, and lines; verify via `bun run test:coverage` or `make test_coverage`.
- Tests live as `*.test.ts(x)` or inside `__tests__`; mock signers and APIs through helpers declared in `vitest.setup.ts`.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes seen in history (e.g., `feat: Setup Next.js application (#2)`); include scope when clarifying.
- Keep commits focused and run `make before_commit` before pushing.
- PRs must reference issues or tasks, note Safe/contract impact, attach artefacts for visible changes, and flag required env vars; request review on signing, policy, or deployment updates.

## Automated Validation & Verification Tools

### Continuous Testing Loop
When implementing features, keep tests running in watch mode:
```bash
bun run test:watch  # Keep visible in terminal during development
```

**15-minute rule**: If tests stay red for >15 minutes, stop coding and revisit the exec plan in `plans.md`. It's a strategy problem, not a coding problem.

### Visual Verification for UI Components
For UI work requiring pixel-perfect accuracy:

1. **Snapshot testing**: Update tests to capture component snapshots
   ```bash
   bun run test -- --update-snapshot
   ```

2. **Visual inspection loop**: After code changes
   ```bash
   # Generate preview
   bun run dev
   # View at http://localhost:3000
   # Document visual diff in plans.md
   ```

3. **Automated screenshot comparison** (future enhancement):
   - Add Playwright for visual regression tests
   - Create scripts to auto-generate and compare screenshots
   - Document in exec plan when implemented

### Smart Contract Validation
For Hardhat contract work:

```bash
# Compile contracts
npx hardhat compile

# Test with gas profiling
npx hardhat test --gas-report

# Never sign with private keys directly - always create Safe proposals
# Document gas costs and contract addresses in plans.md
```

### API Endpoint Validation
For API routes in `src/app/api/`:

1. **Integration tests with real requests**:
   ```typescript
   import { createMocks } from 'node-mocks-http';

   test('API endpoint returns expected response', async () => {
     const { req, res } = createMocks({ method: 'POST', body: {...} });
     await handler(req, res);
     expect(res._getStatusCode()).toBe(200);
   });
   ```

2. **Performance logging**: Track response times in `plans.md`

### Pre-Review Validation Checklist
Before creating PR, verify with `make before_commit`:
- [x] `bun run lint_text` - Markdown quality (textlint)
- [x] `bun run lint` - ESLint checks
- [x] `bun run typecheck` - TypeScript compilation
- [x] `bun run format_check` - Prettier formatting
- [x] `bun run build` - Production build succeeds
- [x] `bun run test` - All tests pass
- [x] `bun run test:coverage` - Coverage at 100%

**Do not create PR if any check is red.**

## Exec Plan Pattern (Living Documentation)

For complex features or bug fixes:

1. **Create `plans.md` before coding** with this structure:
   ```markdown
   # Exec Plan: [Feature/Bug Name]
   Created: YYYY-MM-DD HH:MM

   ## Objective
   [Clear, measurable goal]

   ## Guardrails
   - Must maintain 100% test coverage
   - No private keys in code or CI
   - All Safe proposals must pass OPA validation

   ## TODO
   - [ ] Phase 1: Design and planning
   - [ ] Phase 2: Implementation
   - [ ] Phase 3: Testing and validation

   ## Progress Log
   ### Iteration 1 (HH:MM)
   - Implemented X
   - Tests: N/N passing ✓
   - Coverage: 100% ✓
   - Decision: Chose approach X because...

   ## Open Questions
   - Q: [Question]
   - A: (HH:MM) [Answer with reasoning]
   ```

2. **Update continuously**: After each green test cycle, log:
   - What was implemented
   - Test status
   - Coverage status
   - Decisions made and why

3. **Never delete history**: Append new iterations, preserve decision context

4. **Reference in commits**: Link exec plan in commit messages and PR descriptions

## Debugging & Troubleshooting

### TypeScript Errors
```bash
# Check specific file
npx tsc --noEmit src/path/to/file.ts

# Full diagnostic
npx tsc --noEmit --diagnostics
```

### Test Failures
```bash
# Run single test file
bun run test src/__tests__/example.test.ts

# Run specific test by name
bun run test -t "test name pattern"

# Interactive UI debugger
bun run test:ui
```

### Build Issues
```bash
# Clear cache and rebuild
rm -rf .next
make clean && make install && make build
```

### Coverage Issues
If coverage drops below 100%:
1. Run `bun run test:coverage` to identify uncovered lines
2. Check `vitest.config.ts:15-22` for included/excluded paths
3. Add tests for new code paths
4. Document in `plans.md` what was covered and why
