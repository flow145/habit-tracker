## Tools

- package manager: pnpm
- language: TypeScript
- framework: React
- build tool: Vite
- PWA: vite-plugin-pwa with a web app manifest and service worker
- based on my react-starter with code quality tools setup
- data storage: IndexedDB + idb
- state manager: Zustand
- router: Wouter
- styling: CSS Modules
- headless accessible UI library: Base UI
- forms and validation: Base UI's Form
- testing: mostly integration (Vitest, Testing Library) and some e2e (Playwright, planned)
- i18n: just English for now but use i18next to organize strings and pluralization
- date and time: date-fns

## Rules

- Organize `src` using Feature-Sliced Design (FSD). Keep non-Shared layers and slices flat; use segment directories only within `shared`.

## Habit Data Representation

- Calendar dates are represented as `DayString` values in `YYYY-MM-DD` form and manipulated through `Day`.
- JavaScript `Date` is used only for timestamps and determining the current local date.
- A persisted `Entry` represents one explicit completion.
- Only `complete` is persisted. `incomplete` and `not-required` are calculated at runtime.
- IndexedDB enforces at most one Entry per Habit and Day.
- Computed entries are transient view data and are not persisted.

## State and Persistence

- IndexedDB is the authoritative persistent store.
- Zustand is the observable runtime state used by UI modules.
- Habit actions coordinate changes between IndexedDB and Zustand.
- Day changes are optimistic and roll back when persistence fails.
- Habit creation, editing, and deletion update runtime state only after persistence succeeds.
- Day persistence and Habit deletion are serialized per Habit where they can conflict.

See [ADR 0001](adr/0001-consolidate-habit-data-behind-a-deep-store.md) for the reasoning behind this state and persistence design.
