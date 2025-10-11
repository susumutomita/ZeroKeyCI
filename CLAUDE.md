# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZeroKey CI** is a key-less continuous deployment framework for EVM-based smart contracts (ETHOnline 2025 submission). It eliminates the security risk of storing private keys in CI/CD pipelines by creating Safe proposals instead of signing transactions directly in GitHub Actions.

**Core Philosophy**: No private keys should ever live in CI environments. Execution happens through Gnosis Safe, Lit Protocol Vincent (delegated signing), or local KMS containers.

### Key Integrations
- **Hardhat 3**: Build, simulation, and testing suite for smart contracts
- **Gnosis Safe SDK**: Creates deployment/upgrade proposals without direct signing
- **Blockscout Autoscout/SDK/MCP**: Links PRs to on-chain transactions
- **Lit Protocol Vincent**: Scoped delegated signing (e.g., "upgradeTo only")
- **Envio HyperIndex/HyperSync**: Real-time monitoring of Safe events
- **Open Policy Agent (OPA)**: Verifies payloads before signing
- **SoftKMS/Vault**: Isolated signers with non-exportable keys

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript (strict mode)
- **Styling**: TailwindCSS with Radix UI components
- **Testing**: Vitest with **100% coverage requirement**
- **Package Manager**: **Bun ≥1.0.0** (required, not npm/yarn)
- **Runtime**: Node.js ≥18.0.0

## Development Commands

### Setup
```bash
make install          # Install dependencies via Bun
make setup_husky      # Setup git hooks
```

### Development
```bash
make dev              # Start Next.js dev server
make build            # Production build
make start            # Start production server
```

### Code Quality (Pre-commit)
```bash
make before_commit    # Run ALL checks: lint_text, lint, typecheck, format_check, build, test
```

Individual checks:
```bash
make lint             # ESLint (Next.js config)
make lint_text        # Textlint (markdown with Japanese AI writing rules)
make typecheck        # TypeScript compiler check (tsc --noEmit)
make format_check     # Prettier format verification
make format           # Auto-fix formatting issues
```

### Testing
```bash
make test                # Run tests once
bun run test:watch       # Watch mode (use during development)
bun run test:ui          # Interactive UI test runner
make test_coverage       # Coverage report (must meet 100% thresholds)
```

**Critical**: All code must achieve **100% coverage** (branches, functions, lines, statements). Tests fail if coverage drops below 100%.

## Architecture & Structure

### Next.js App Router
- **App directory**: `src/app/` (Next.js 15 App Router)
- **Path alias**: `@/*` maps to `./src/*`
  - Example: `import { Button } from "@/components/ui/button"`
- **Layout**: `src/app/layout.tsx` (Inter font, base metadata)
- **Home**: `src/app/page.tsx`

### Testing Configuration
- **Test location**: `src/__tests__/` or colocated `*.test.ts`/`*.spec.ts`
- **Environment**: Node.js (not jsdom)
- **Setup**: `vitest.setup.ts` runs before all tests
- **Mocking**: Auto-reset and restore mocks between tests
- **Coverage**: Enforced 100% on `src/**/*.{ts,tsx}` (excluding tests, stories, type definitions)

### CI/CD Pipeline
GitHub Actions (`.github/workflows/ci.yml`) runs on every push:
1. Textlint (markdown quality)
2. ESLint (code quality)
3. Prettier format check
4. Tests with coverage

**Test Environment Variables**:
```bash
CI=true
NODE_ENV=test
EMBEDDING_PROVIDER=ollama
NOMIC_API_KEY=test-api-key-for-ci
```

### Smart Contract Deployment Flow
1. Developer opens PR → Hardhat tests run automatically
2. On merge → CI compiles contracts, builds Safe transaction proposal
3. Policy gateway checks payload → signs via KMS if approved
4. Safe owners or Lit delegates finalize execution
5. Blockscout and Envio update dashboards in real-time

**Key Feature**: PR diff hash automatically generates `upgradeTo()` payload with metadata embedded in Safe transaction fields.

## AI-First Development Workflow

This workflow is inspired by OpenAI's Codex engineering team practices, emphasizing constraint-based autonomous work with continuous validation.

### Phase 1: Exec Plan Creation (Living Documentation)

**Before writing any code**, create or open `plans.md`:

1. **Create an "exec plan"** (use this exact term - it signals special treatment)
   - Title: Feature name or bug identifier
   - **Objective**: Clear goal statement
   - **Guardrails**: Non-negotiable constraints (security, performance, coverage)
   - **TODO List**: Granular, ordered tasks
   - **Validation Steps**: How to verify each phase
   - **Open Questions**: Unknowns that need resolution
   - **Timestamp**: When plan started

2. **Update the plan continuously**:
   - Log **all decisions and trade-offs** with reasoning
   - Record progress after each green build/test cycle
   - Append context (never delete history - it's your memory)
   - Link to relevant discussions, docs, or PRs
   - Track iteration count and elapsed time

3. **Exec plan structure example**:
   ```markdown
   # Exec Plan: [Feature/Bug Name]
   Created: 2025-10-12 07:30

   ## Objective
   [Clear, measurable goal]

   ## Guardrails
   - Must maintain 100% test coverage
   - No private keys in code or CI
   - All Safe proposals must pass OPA validation

   ## TODO
   - [x] Design phase (timestamp: 07:35)
   - [ ] Implementation phase
   - [ ] Validation phase

   ## Progress Log
   ### Iteration 1 (07:40)
   - Wrote initial implementation
   - Tests: 15/15 passing ✓
   - Coverage: 100% ✓
   - Decision: Used X approach instead of Y because...

   ## Open Questions
   - Q: Should we cache Safe proposals?
   - A: (07:45) Yes, using Redis with 1h TTL per discussion with...
   ```

### Phase 2: Test-First Development Loop

**Key principle**: Tests are your constraints. Code within these constraints until all green.

1. **Keep tests running continuously**:
   ```bash
   bun run test:watch  # Always visible in terminal
   ```

2. **Start with the smallest failing test**:
   - Write test first (TDD)
   - Implement minimal code to pass
   - Refactor with tests green
   - Update `plans.md` progress log

3. **Automated validation setup**:
   - For UI work: Set up **snapshot tests** or visual regression tests
   - For API work: Set up integration tests with **real requests**
   - For contracts: Set up Hardhat tests with **gas profiling**
   - Document these validation scripts in `AGENTS.md`

4. **Iteration rules**:
   - **If tests stay red > 15 minutes**: Stop, revisit exec plan, adjust approach
   - **If coverage drops below 100%**: Stop immediately, add tests
   - After each green cycle: Update `plans.md` with progress and decisions
   - Run full validation before moving to next TODO:
     ```bash
     bun run test && bun run test:coverage && make typecheck && make lint
     ```

5. **Visual verification for UI work**:
   - Generate preview images/screenshots automatically
   - Compare against expected output
   - Iterate code → generate → verify → repeat until pixel-perfect
   - Log visual diffs in `plans.md`

### Phase 3: Self-Review Before PR

**Humans don't see code until it's been self-reviewed.**

1. **Run thorough self-review**:
   - Read entire diff and check for:
     - Intent vs implementation alignment
     - Edge cases covered by tests
     - Security implications (especially key handling, Safe proposals)
     - Performance bottlenecks
     - Documentation completeness

2. **Check against exec plan**:
   - All TODOs completed? ✓
   - All guardrails respected? ✓
   - All validation steps passed? ✓
   - All decisions documented? ✓

3. **Run final validation**:
   ```bash
   make before_commit  # Must be 100% green
   ```

4. **If any issues found**:
   - Document in `plans.md` (iteration N+1)
   - Fix and repeat validation
   - **Do not proceed to PR while ANY check is red**

### Phase 4: Documentation & Handoff

1. **Update `AGENTS.md`** if you added:
   - New automation hooks
   - Validation scripts
   - Workflow expectations
   - Testing utilities

2. **Update README** for:
   - External behavior changes
   - New manual runbooks
   - API changes

3. **Finalize `plans.md`**:
   - Summary: What shipped
   - Test status: Final coverage report
   - Outstanding risks: Known limitations
   - Follow-ups: Manual tasks or future work

4. **PR description must include**:
   - Link to `plans.md` exec plan
   - Verification evidence:
     - Test output
     - Coverage report
     - Screenshots (for UI changes)
     - Performance metrics (for optimizations)
   - Required reviewers (for signing/policy changes)

### Phase 5: Continuous Improvement

After each significant feature/fix:

1. **Reflect on the exec plan quality**:
   - Did the plan need frequent revisions?
   - Were guardrails sufficient?
   - Did validation catch issues early?

2. **Improve automation**:
   - Add new validation scripts if manual verification was needed
   - Document new patterns in `AGENTS.md`
   - Update `plans.md` template if structure was inadequate

3. **Share learnings**:
   - Document complex decisions in `plans.md` for future reference
   - Update this CLAUDE.md if workflow improved

---

## Core Principles (OpenAI Codex Team Style)

1. **Tests are constraints, not afterthoughts**: Write tests first, code within constraints.
2. **Plans.md is your memory**: Living documentation prevents context loss across long sessions.
3. **Red tests for >15 min = strategy problem**: Don't code harder, revise the plan.
4. **Automated validation > manual inspection**: Spend time building verification, not verifying manually.
5. **Self-review before human review**: Humans see code only after AI has validated it thoroughly.
6. **Append, never delete context**: Your decision log is invaluable for debugging and handoffs.
7. **Unique terminology matters**: "Exec plan" (not "plan") makes AI treat it specially.

## Important Constraints

### Security
- **Never expose private keys** in code or CI environments
- All signing operations must go through Safe proposals or KMS
- Use OPA policies for declarative enforcement before signing

### Package Manager
- **Must use Bun**: This project requires Bun ≥1.0.0
- Lock file: `bun.lock` (not `package-lock.json` or `yarn.lock`)
- CI install: `make install_ci` uses `bun install --no-frozen-lockfile`

### Code Standards
- **100% test coverage** is mandatory (enforced by Vitest config)
- **Strict TypeScript** enabled
- **Textlint** enforces Japanese writing quality in markdown
- **Prettier** for consistent formatting across all files

## Troubleshooting

### Build Issues
```bash
make typecheck        # Check TypeScript errors
make lint            # Check ESLint errors
make install         # Reinstall dependencies
```

### Test Coverage Failures
If coverage is below 100%:
- Add tests to `src/__tests__/` for unit tests
- Add inline test files (`*.test.ts`) for component/integration tests
- Check `vitest.config.ts:15-22` for what's included/excluded from coverage

### Bun-specific Issues
```bash
bun --version        # Should be ≥1.0.0
# Install if missing: curl -fsSL https://bun.sh/install | bash
```
