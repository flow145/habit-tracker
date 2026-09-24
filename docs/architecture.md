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
- Require habit-day identity and calendar arithmetic to use `Day`/`DayString`; reserve JavaScript `Date` for timestamps and determining the current local date.
