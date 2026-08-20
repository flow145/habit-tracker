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
| Title       | 23px | 120%        | Semibold | 26px         |
| Heading     | 20px | 120%        | Medium   | 22px         |
| Subheading  | 18px | 120%        | Medium   | 20px         |
| Body medium | 16px | 140%        | Regular  | same         |
| Body small  | 14px | 140%        | Regular  | same         |
| Button      | 16px | 100%        | Medium   | same         |
| Label       | 16px | 140%        | Medium   | same         |
| Hint        | 13px | 120%        | Medium   | same         |

## Layout

Desktop is not a different experience.

Instead:
- single centered column
- wider components
- larger spacing
- slightly larger typography

Target maximum content width: **800px**

## Habit entries

Icons for different entry statuses:
- Squircle outline for incomplete days (Fits the overall rounded-rectangle design language better than circles)
- Checkmark for completed
- Muted checkmark for auto-completed days
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

Habit entry controls should be implemented as accessible toggle-like controls that can cycle through statuses while remaining keyboard accessible.
