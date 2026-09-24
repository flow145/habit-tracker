# Business Rules

Domain terms are defined in the project [context glossary](../CONTEXT.md).

## Habits

- A habit has a name, an optional description, and one current schedule.
- Changing a habit's schedule recalculates its statuses for all days; schedules are not versioned by date.
- Deleting a habit permanently deletes its completion history.

## Schedules

- A schedule defines a target frequency, interval length, and interval unit.
- The target frequency is the minimum number of completed days required within a schedule window.
- The frequency and interval must be positive integers.
- Supported interval units and their maximum lengths are `n` days, `7 * n` days for `n` weeks, and `31 * n` days for `n` months.
- The frequency must not exceed the interval's maximum length.

## Schedule Windows

- A schedule window advances one day at a time. Its start and end days are inclusive.
- Day windows contain the specified number of days, and week windows contain `7 * n` days.
- Month windows use calendar-month arithmetic and may contain different numbers of days; a one-month window contains at most 31 days.
- If a window starts with a completed day and contains the target number of completions, every later uncompleted day in that window is `not-required`.
- A window never makes its starting day `not-required`.
- Each schedule window is evaluated independently. A day is `not-required` when at least one applicable window makes it `not-required`.

## Day Statuses

- A habit can have at most one completion per day.
- `complete` means the user marked the habit complete for that day, regardless of whether the schedule required it.
- `incomplete` means the day has not been completed and the schedule still requires completion.
- `not-required` means the day has not been completed and the schedule's target has already been satisfied.
- Users may complete a `not-required` day.
- Marking a completed day incomplete removes its completion.
- Removing a completion recalculates every affected day.
- Statuses are recalculated after a completion change, schedule change, or transition to a new day.

## Calendar Dates and History

- Completions remain attached to the local calendar date on which they were recorded, even after the user changes time zones.
- If a time-zone change makes a completion's day future relative to the new local date, the completion is retained and appears again when the timeline reaches it.
- Future days cannot be completed.
- Users may change past days displayed by the app.
- Days before a habit's creation receive no special treatment and follow the same schedule and status rules.

## Habit List

- All habits in one list share the same timeline range, so habit rows align under the same day columns.
- The habit list page ends the timeline at the current local day.
