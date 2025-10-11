# Exec Plans

This file tracks execution plans for features and bug fixes. Each exec plan is a living document updated continuously as work progresses.

---

## Template: Copy this for new exec plans

```markdown
# Exec Plan: [Feature/Bug Name]
Created: YYYY-MM-DD HH:MM
Status: 🟡 In Progress / ✅ Completed / ⏸️ Paused / ❌ Blocked

## Objective
[Clear, measurable goal. What success looks like.]

## Guardrails (Non-negotiable constraints)
- Must maintain 100% test coverage
- No private keys in code or CI environments
- All Safe proposals must pass OPA validation
- [Add project-specific constraints]

## TODO
- [ ] Phase 1: [Task description]
  - [ ] Subtask 1.1
  - [ ] Subtask 1.2
- [ ] Phase 2: [Task description]
- [ ] Phase 3: [Task description]

## Validation Steps
- [ ] All tests pass (`bun run test`)
- [ ] Coverage at 100% (`bun run test:coverage`)
- [ ] TypeScript compiles (`make typecheck`)
- [ ] Linting passes (`make lint`)
- [ ] Build succeeds (`make build`)
- [ ] Visual verification (if UI work)
- [ ] [Add feature-specific validation]

## Progress Log

### Iteration 1 (HH:MM)
**What was done:**
- [Describe implementation]

**Test status:**
- Tests: N/N passing ✓
- Coverage: 100% ✓

**Decisions made:**
- Decision: [What was decided]
- Reasoning: [Why this approach]
- Alternatives considered: [What else was evaluated]

**Blockers/Issues:**
- [Any problems encountered]

### Iteration 2 (HH:MM)
[Continue logging iterations...]

## Open Questions
- **Q**: [Question]
  - **A** (HH:MM): [Answer with reasoning and who/what informed it]

## References
- Related PRs: #[number]
- Related Issues: #[number]
- Documentation: [links]
- Discussions: [links]

## Handoff Notes
**Final Summary:**
- [What shipped]
- [What didn't ship and why]

**Outstanding Risks:**
- [Known limitations or risks]

**Follow-up Tasks:**
- [Manual tasks needed]
- [Future improvements]
```

---

## Active Exec Plans

### Exec Plan: Setup AI-First Development Workflow
Created: 2025-10-12 07:27
Status: ✅ Completed

#### Objective
Establish OpenAI Codex team-style development workflow with:
- Living documentation (plans.md)
- Automated validation tools
- Test-first development constraints
- Fix broken lint commands

#### Guardrails
- Must maintain 100％ test coverage
- All validation commands must pass (`make before_commit`)
- No breaking changes to existing functionality
- Preserve Codex's existing documentation structure

#### TODO
- [x] Analyze codebase structure
- [x] Create/update CLAUDE.md with AI-First workflow
- [x] Extend AGENTS.md with validation tools (respecting Codex's work)
- [x] Create plans.md template
- [x] Fix textlint command (was using incorrect syntax)
- [x] Migrate from `next lint` to ESLint CLI (Next.js 16 deprecation)
- [x] Verify all checks pass

#### Validation Steps
- [x] `bun run lint_text` passes
- [x] `bun run lint` passes (ESLint CLI)
- [x] `bun run typecheck` passes
- [x] `bun run format_check` passes
- [x] `bun run build` succeeds
- [x] `bun run test` passes
- [x] `make before_commit` completes successfully

#### Progress Log

##### Iteration 1 (07:27-07:35)
**What was done:**
- Created comprehensive CLAUDE.md with OpenAI Codex workflow
- Added 5 phases: Exec Plan Creation, Test-First Loop, Self-Review, Documentation, Continuous Improvement
- Documented 7 core principles

**Test status:**
- Build: ✓ Successful
- Initial validation: Pending

**Decisions made:**
- Decision: Use "exec plan" terminology (not just "plan")
- Reasoning: Unique terms help AI treat documents specially (learned from Feler's 7-hour セッション)
- Alternatives: Generic "plan" - rejected because less distinctive

##### Iteration 2 (07:35-07:38)
**What was done:**
- Extended AGENTS.md (preserved Codex's existing structure)
- Added automated validation tools section
- Added 15-minute rule for test failures
- Added exec plan pattern documentation

**Test status:**
- Tests: N/A (documentation only)
- File conflicts: Resolved by reading first, then editing

**Decisions made:**
- Decision: Collaborate with Codex by extending, not replacing
- Reasoning: User explicitly stated "独りよがりは駄目だ" (don't be self-centered)
- Implementation: Read existing AGENTS.md, append sections only

##### Iteration 3 (07:38-07:40)
**What was done:**
- Fixed textlint command in package.json
- Changed from `bun exec textlint '**/*.md'` to `textlint "**/*.md"`
- Disabled `max-comma` rule in .textlintrc (false positives on English docs)

**Test status:**
- textlint: ✓ All files pass
- Coverage: N/A (config changes)

**Blockers/Issues:**
- Initial command failed with "function definition file not found"
- Resolution: Command syntax issue with Bun's exec + glob pattern

##### Iteration 4 (07:40-07:42)
**What was done:**
- Migrated from `next lint` to ESLint CLI
- Ran codemod: `npx @next/codemod@canary next-lint-to-eslint-cli .`
- Updated package.json: `"lint": "eslint ."`
- Added `@eslint/eslintrc` dependency

**Test status:**
- lint: ✓ No errors, no deprecation warnings
- All checks: ✓ `make before_commit` passed

**Decisions made:**
- Decision: Migrate immediately to ESLint CLI
- Reasoning: Next.js 16 will remove `next lint`, better to migrate now
- Impact: No breaking changes, existing ESLint config still works

#### Final Validation (07:42)
```bash
✅ lint_text    - textlint passed
✅ lint         - ESLint CLI (no warnings)
✅ typecheck    - TypeScript successful
✅ format_check - Prettier correct
✅ build        - Next.js build (582ms)
✅ test         - All tests passed (1/1)
```

#### Open Questions
- **Q**: Should we add Playwright for visual regression testing?
  - **A**: Not now. Documented as future enhancement in AGENTS.md. Can add when UI work begins.

- **Q**: Keep or remove 100％ coverage requirement?
  - **A**: Keep. It's a guardrail that ensures quality. Documented in vitest.config.ts.

#### References
- OpenAI Dev Day Codex team workflow presentation
- Next.js 16 migration guide: https://eslint.org/docs/latest/use/configure/migration-guide

#### Handoff Notes

**Final Summary:**
- Created AI-First development workflow documentation
- Fixed broken lint commands (textlint + ESLint CLI migration)
- All validation passes, ready for production use

**Files Created:**
- `CLAUDE.md` - Comprehensive AI-First workflow guide
- `plans.md` - This living documentation template
- `.textlintrc` - Updated (disabled max-comma rule)

**Files Modified:**
- `AGENTS.md` - Extended with validation tools (preserved Codex's structure)
- `package.json` - Fixed textlint command, migrated to ESLint CLI
- `.textlintrc` - Disabled max-comma rule for English docs

**Outstanding Risks:**
- None. All checks green.

**Follow-up Tasks:**
- Consider migrating to flat ESLint config (eslint.config.js) in future
- Add visual regression testing when UI development begins
- Document Hardhat workflow when smart contract work starts

<!-- Keep completed plans for historical reference -->

## Exec Plan: Document Spec-First Workflow
Created: 2025-10-11 23:00
Status: 🟡 In Progress

## Objective
Document the spec-first workflow described in README instructions so every agent understands how to operate the editor integration.

## Guardrails (Non-negotiable constraints)
- Maintain README clarity and follow formatting conventions.
- Keep AGENTS/CLAUDE docs aligned; no conflicting guidance.
- All markdown lint checks must stay green.

## TODO
- [x] Confirm README instructions and extract exact modifications.
- [ ] Update README bullet list with Spec-first item.
- [ ] Insert Specs & Editor Integration section verbatim.
- [ ] Run `bun run lint_text` to validate markdown.
- [ ] Stage and commit once checks pass.

## Validation Steps
- [ ] `bun run lint_text`

## Progress Log
### Iteration 1 (23:00)
- Parsed README instructions and noted required additions.
- Tests: n/a
- Coverage: n/a
- Decision: Treat README instructions as primary objective per user request.

## Open Questions
- None

## References
- README instructions section

## Handoff Notes
**Final Summary:** _TBD_

**Outstanding Risks:** _TBD_

**Follow-up Tasks:** _TBD_
