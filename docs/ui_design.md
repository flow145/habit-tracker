## Design principles

- Calm, focused interface.    
- Flat design with almost no visual depth.
- Consistency over decoration.
- Fast daily interactions are prioritized over visual flourish.

## Visual style

- Flat controls (buttons, inputs, cards).
- Shadows used only for floating surfaces (dialogs, popovers, selects).
- Spacing/sizing variables from Simple Design System.
- 8px border radius throughout the app.
- No accent color in Alpha 1.
- Neutral palette based on Radix Slate.
- Habit colors postponed until Alpha 2.
- Icons from Lucide with 2px stroke.
- Font: Geist.

## Typography

| Style       | Size | Line height | Weight   | Desktop size |
| ----------- | ---- | ----------- | -------- | ------------ |
| Title       | 23px | 28px        | Semibold | 26px         |
| Heading     | 20px | 24px        | Medium   | 22px         |
| Subheading  | 18px | 22px        | Medium   | 20px         |
| Body medium | 16px | 22px        | Regular  | same         |
| Body small  | 14px | 20px        | Regular  | same         |
| Button      | 16px | 21px        | Medium   | same         |
| Label       | 16px | 22px        | Medium   | same         |
| Hint        | 13px | 16px        | Medium   | same         |

## Layout

Desktop is not a different experience.

Instead:
- single centered column
- wider components
- larger spacing
- slightly larger typography

Target maximum content width: **800px** or **500px** for forms

## Day statuses

Icons for different statuses:
- Squircle outline for incomplete days (Fits the overall rounded-rectangle design language better than circles)
- Checkmark for completed days
- Muted checkmark for `not-required` days
- Minus/dash for skipped days

## Colors

- Radix color palette.
- Neutral Slate colors for nearly everything.
- No global accent color.
- Habit-specific colors planned for Alpha 2.

## Design system

- Started from Figma Simple Design System.
- Customize components when needed rather than treating it as fixed.
- Consistency is preferred over copying the original system exactly.

## Accessibility

Habit day controls should be implemented as accessible toggle-like controls that can cycle through statuses while remaining keyboard accessible.
