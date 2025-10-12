# Repository Guidelines
ZeroKey CI pairs Next.js 15, Bun, and Vitest. Drive each change from a living exec plan with green tests.

## Agent Execution Protocol
- Read `CLAUDE.md` before coding and refresh the active exec plan in `plans.md`.
- Respect the Bun toolchain (`packageManager` is `bun@1.1.38`); never run `npm install`.
- Keep the exec plan current with scope, TODOs, validation steps, and newly created scripts.
- Stay in the red→green loop by rerunning the smallest failing test before handing anything off.
- Follow textlint rules: sentences that include Japanese must end with `。` to keep `bun run lint_text` green.
- After creating PR, immediately verify CI with `gh pr checks [PR_NUMBER]` and only report as ready when GREEN (MANDATORY)。
- Perform self-review using `gh pr diff [PR_NUMBER]` before reporting PR as ready (MANDATORY)。
- Document retrospectives for all issues in plans.md with Problem/Root Cause/Prevention format (MANDATORY)。

## Project Structure & Module Organization
- `src/app/` holds App Router entries (`layout.tsx`, `page.tsx`) and shared styles in `globals.css`.
- `src/__tests__/` stores Vitest suites; co-locate feature checks as `*.test.ts(x)` when advantageous.
- `public/` exposes static assets referenced by the UI and dashboards.
- Root configs (`next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `vitest.setup.ts`) centralize build, styling, and test rules; import via the `@` alias defined in `tsconfig.json`.

## Build, Test, and Development Commands
- `bun install` (CI uses `bun run install:ci`) restores dependencies.
- `bun run dev` or `make dev` launches the local app on http://localhost:3000.
- `bun run build` / `make build` produces the production bundle; `bun run start` serves it.
- Quality gates: `bun run lint`, `bun run typecheck`, `bun run format_check`, `bun run test`, `make before_commit`.

## Coding Style & Naming Conventions
- Prettier enforces two-space indentation and single quotes; run `bun run format` before review.
- Components use PascalCase, hooks/utilities camelCase, directories under `src/app` kebab-case.
- Compose Tailwind classes in layout → spacing → typography order; rely on `clsx` + `tailwind-merge` for conditional styling.

## Testing Guidelines
- Vitest loads globals and hooks from `vitest.setup.ts`; prefer `bun run test` for CI parity and `bun run test:watch` locally.
- Coverage thresholds lock at 100％ for statements, branches, functions, and lines; verify with `bun run test:coverage` or `make test_coverage`.
- Mock signers, API clients, and timers via helpers registered in `vitest.setup.ts`.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes seen in history (e.g., `feat: Setup Next.js application (#2)`), adding scope when clarifying.
- Keep commits focused, cite the exec plan in the body, and run `make before_commit` before pushing.
- PRs must link issues or hackathon tasks, note Safe or contract impact, attach evidence, flag required env vars, and request review on signing or policy changes.
