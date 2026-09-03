## Frontend

- package manager: pnpm
- language: TypeScript
- framework: React
- build tool: Vite
- based on my react-starter with code quality tools setup
- data storage: IndexedDB + idb
- state manager: Zustand
- router: Wouter
- styling: CSS Modules
- headless accessible UI library: Base UI
- forms and validation: decide later: just Base UI's Form component + Zod OR React Hook Form + Zod
- testing: mostly integration (Vitest, Testing Library) and some e2e (Playwright)
- i18n: just English for now but use i18next to organize strings and pluralization
- date and time: date-fns

## Rules

- Always use days from the same generator `buildComputedEntries()`
