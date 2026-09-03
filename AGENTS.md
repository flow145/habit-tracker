# Habit tracker

A simple, cross-platform habit tracker with flexible scheduling and a focus on long-term consistency over streaks.

## Project documentation

1. `docs/vision.md`
2. `docs/features.md`
3. `docs/user_stories.md`
4. `docs/user_flows.canvas`
5. `docs/ui_design.md`
6. `docs/business_rules.md`
7. `docs/architecture.md`

## Common commands

- `pnpm build`: `vite build`
- `pnpm format`: `biome format --reporter=summary`
- `pnpm format:fix`: `pnpm format --write`
- `pnpm check`: `biome check --reporter=summary`
- `pnpm check:fix`: `pnpm check --write`
- `pnpm typecheck`: `tsc -b`
- `pnpm test`: `vitest run`

Add options to these pnpm commmands if needed instead of running vitest/biome/etc directly. Example: `pnpm exec biome check src/app/entrypoint/App.tsx` -> `pnpm check src/app/entrypoint/App.tsx`.
