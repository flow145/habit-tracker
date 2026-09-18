# Habit tracker

A simple, cross-platform habit tracker with flexible scheduling and a focus on long-term consistency over streaks.

## Product context

Before changing product behavior, consult the applicable source of truth:

- **Product direction:** `docs/vision.md`
- **Features, user stories, or business rules:** `docs/features.md`, `docs/user_stories.md`, and `docs/business_rules.md`
- **User flows or interface design:** `docs/user_flows.canvas` and `docs/ui_design.md`
- **Architecture:** `docs/architecture.md`

## Verification

Use the repository's `pnpm` scripts for build, formatting, checks, type-checking, and tests; `package.json` is authoritative. Forward paths and options through the matching script, for example `pnpm check src/app/entrypoint/App.tsx`.

## Repository workflows

### GitHub tracker

For GitHub issue or pull-request work, read `docs/agents/issue-tracker.md` before making tracker changes.

### Triage labels

For issue or pull-request triage, read `docs/agents/triage-labels.md` and use its canonical labels.

### Domain docs

Before exploring a domain area, proposing a domain-model change, or naming domain concepts, read `docs/agents/domain.md`.
