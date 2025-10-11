# Claude Agent Playbook
Follow this checklist when you modify ZeroKey CI. The priority is to operate from constraints: living exec plans, green tests, clear documentation.

## Exec Plan Ceremony
1. Before touching code, open or create the relevant section in `plans.md` using the provided template and the phrase “exec plan”.
2. Log objective, guardrails, ordered TODOs, validation steps, and open questions. Append updates with timestamps; never delete history.
3. After each meaningful change, record what was done, which checks passed, and decisions made. Reference the exec plan in commit bodies and PR descriptions.

## Development Loop
- Use `bun run test:watch` while iterating; keep the red-to-green cycle short.
- Once changes stabilize, run `bun run test`, `bun run test:coverage`, and `make before_commit`. Stop immediately if any command fails and update the exec plan with the blocker.
- Prefer incremental commits tied to individual TODO items from the plan.

## Documentation Duties
- Update `AGENTS.md` when introducing new automation, validation scripts, or workflow expectations so future agents inherit the context.
- If behaviour changes or manual steps are added, extend the relevant section of `README.md` and note the update inside the exec plan.
- Capture artefacts (screenshots, logs) referenced in PRs; store their locations in `plans.md` for auditability.

## Handoff Protocol
- Summarise the final state in `plans.md`: shipped work, outstanding risks, follow-ups, and the latest test status.
- Ensure the PR description links the exec plan, lists verification evidence, and names required reviewers for signing, policy, or deployment changes.
- Request human review only after `make before_commit` passes and the exec plan reflects the current state.
