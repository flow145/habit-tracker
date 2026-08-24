# Business Rules

## Domain Terms

- **Entry**: A persisted record for one habit and one calendar day. In the current model, an entry represents an explicit user completion and has the status `complete`. A missing entry does not represent an explicit `incomplete` status.
- **Computed entry**: A generated representation of a habit for a calendar day in the displayed timeline. Computed entries are used by the UI and are not persisted.
- **Explicit status**: A status directly recorded by the user and persisted in an entry. The current implementation supports only the explicit status `complete`.
- **Derived status**: A status inferred from the habit's schedule and explicit completion statuses. It is either `incomplete` or `not-required` and is not persisted.
- **Computed status**: The final status assigned to a computed entry. A computed status is either an explicit status or a derived status.

## Schedules

- A schedule defines a target frequency, interval length, and interval unit.
- The target frequency is the minimum number of user-completed days required within a schedule window.
- The frequency and interval must be positive integers.
- The frequency must not exceed the interval length expressed in calendar days.
- Supported interval units are days, weeks, and months.
- Scheduling uses rolling windows of the specified interval.
- A day-based interval of `n` days spans `n` calendar days.
- A week-based interval of `n` weeks spans `7 * n` calendar days.
- A month-based interval of `n` months spans the corresponding rolling calendar-month period. A one-month interval can contain 28 to 31 calendar days.
- Schedules are evaluated in the current device's time zone.

## Rolling Windows

- A rolling window advances one calendar day at a time. Its start and end dates are inclusive.
- At each position, if the window's start day has an explicit completion and the window contains at least the schedule's target frequency of explicit completions, every later day in the window without an explicit completion is derived as `not-required`.
- The window's start day is never derived as `not-required` by that window.
- Each rolling window is evaluated independently. A day is derived as `not-required` when at least one applicable window derives it as `not-required`.

## Status Calculation

- `incomplete` means the user has not marked the day complete and the schedule currently requires a completion.
- `not-required` means the user has not marked the day complete and the schedule currently does not require a completion.
- `complete` means the user explicitly marked the day complete, regardless of whether the schedule required it.
- Computed statuses are recalculated immediately after a status change, schedule update, or transition to a new day.

## Entry Rules

- Future days cannot be marked complete in the UI.
- Users may change the status of past days.
- Users may mark a `not-required` day complete.
- Removing a completion removes the explicit status; it does not create an explicit `incomplete` status.
- Removing a completion recalculates all affected computed entries as `incomplete` or `not-required`, as appropriate.
- Deleting a habit permanently deletes all of its entries.

## Timeline

- All habits share a display timeline ending at the later of the current local date and the latest stored entry date.
- Shared timelines ensure that habit rows align under the same date columns.
