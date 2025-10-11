# Repository Guidelines
ZeroKey CI pairs Next.js 15, Bun, and Vitest. Work from a living exec plan and keep tests green so autonomous agents can deliver safely.

## Agent Execution Protocol
- Read `CLAUDE.md` before coding; start or update the active exec plan in `plans.md`.
- Log scope, TODOs, validation steps, and decisions in the exec plan while you work.
- Run the smallest failing test, iterate, and refuse to hand off while any check stays red.
- Document new scripts or manual verification loops in `plans.md` so future runs stay reproducible.

## Project Structure & Module Organization
- `src/app/` holds App Router entries (`layout.tsx`, `page.tsx`) and shared styles in `globals.css`.
- `src/__tests__/` stores Vitest suites; co-locate feature checks as `*.test.ts(x)` when advantageous.
- `public/` exposes static assets referenced by the UI and dashboards.
- Root configs (`next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `vitest.setup.ts`) centralize build, styling, and test rules; import via the `@` alias defined in `tsconfig.json`.

## Build, Test, and Development Commands
- `bun install` (CI uses `bun run install:ci`) restores dependencies.
- `bun run dev` or `make dev` launches the local app on http://localhost:3000.
- `bun run build` / `make build` produces the production bundle; `bun run start` serves it.
- Quality gates: `bun run lint`, `bun run typecheck`, `bun run format_check`, `bun run test`, and `make before_commit` to chain them.

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
- PRs must link issues or hackathon tasks, note Safe or contract impact, attach evidence (screens/logs), flag required env vars, and request review on signing or policy changes.
