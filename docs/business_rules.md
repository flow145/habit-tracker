# Business Rules

## Domain Terms

- **Day**: A calendar date identified by a `YYYY-MM-DD` string. Its identity does not change when the user crosses time zones. Days are what entries and computed entries refer to, what the timeline shows as columns, and what schedules are evaluated against.
- **Entry**: A persisted record for one habit and one day. In the current model, an entry records that the user marked a day complete and therefore has the explicit status `complete`. A missing entry does not represent an explicit `incomplete` status.
- **Computed entry**: A generated representation of a habit for a day in the displayed timeline. Computed entries are used by the UI and are not persisted.
- **Status**: The state of a habit for a day. There are three kinds of status:
  - **Explicit status**: A status directly recorded by the user and persisted in an entry. The current implementation supports only the explicit status `complete`.
  - **Derived status**: A status inferred from the habit's schedule and explicit statuses. It is either `incomplete` or `not-required` and is not persisted.
  - **Computed status**: The final status assigned to a computed entry. It is either an explicit status or a derived status.

## Schedules

- A schedule defines a target frequency, interval length, and interval unit.
- The target frequency is the minimum number of completed days required within a schedule window.
- The frequency and interval must be positive integers.
- Supported interval units and their maximum lengths are `n` days, `7 * n` days for `n` weeks, and `31 * n` days for `n` months.
- The frequency must not exceed the interval's maximum length.
- Schedules are evaluated in schedule windows of the specified interval.
- Schedules are evaluated using calendar dates; a time-zone change does not change the computed status of a given day.

## Schedule Windows

- A schedule window advances one day at a time. Its start and end days are inclusive.
- At each position, if the window's start day is completed and the window contains at least the schedule's target frequency of completed days, every later day in the window that is not completed is derived as `not-required`.
- The window's start day is never derived as `not-required` by that window.
- Each schedule window is evaluated independently. A day is derived as `not-required` when at least one applicable window derives it as `not-required`.
- Day windows contain the specified number of days, and week windows contain `7 * n` days.
- Month windows use calendar-month arithmetic and may contain different numbers of days; a one-month window contains at most 31 days.

## Status Calculation

- `incomplete` means the user has not marked the day complete and the schedule currently requires the day to be completed.
- `not-required` means the user has not marked the day complete and the schedule currently does not require the day to be completed.
- `complete` means the user explicitly marked the day complete, regardless of whether the schedule required it.
- Computed statuses are recalculated immediately after a status change, schedule update, or transition to a new day.

## Entry Rules

- Future days cannot be marked complete in the UI.
- An entry remains attached to the local calendar date on which the user marked it. If travel makes that date future relative to the new local date, the entry is retained and appears again when the timeline reaches it.
- Users may change the status of past days.
- Users may mark a `not-required` day complete.
- Marking a completed day incomplete removes its explicit status; it does not create an explicit `incomplete` status.
- Marking a day incomplete recalculates all affected computed entries as `incomplete` or `not-required`, as appropriate.
- Deleting a habit permanently deletes all of its entries.

## Timeline

- All habits in one list share the same timeline range, so habit rows align under the same day columns.
- The habit list page ends the timeline at the current local day.
- The timeline may include days before a habit's creation date. Such days have no special treatment and follow the regular schedule and status rules.
