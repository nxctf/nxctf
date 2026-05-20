# UI Standards (shadcn-first)

## Goals

- Clean, readable, responsive UI.
- Consistent interaction patterns.
- User-friendly flows with minimal visual noise.
- No “AI-slop” output: every component must look intentional and system-consistent.

## Core Style Direction

- Use shadcn/base UI primitives first.
- Flat surfaces preferred.
- **No decorative drop shadows** for cards, panels, buttons, modals.
- Use spacing, border contrast, and typography hierarchy instead of shadows.
- Keep visual density medium-compact (dashboard-friendly).

## Do

- Use semantic color tokens (`bg-background`, `text-foreground`, `border-border`).
- Use consistent radius scale (`rounded-md`, `rounded-lg`) only where needed.
- Prefer subtle borders over shadows for separation.
- Use predictable section structure:
  - header
  - controls
  - content
  - actions
- Keep responsive behavior explicit:
  - stack on mobile
  - split panes/grid on desktop
- Keep forms short and grouped with clear labels/help text.
- Use clear empty states and loading states.
- Keep primary actions obvious and secondary actions quiet.
- Keep line length readable and spacing consistent.

## Do Not

- Do not add random gradients, glow effects, or heavy visual effects.
- Do not use mixed spacing scales in one section.
- Do not use inconsistent button styles for equal-priority actions.
- Do not hide important actions behind unclear icon-only buttons.
- Do not rely on color alone for status meaning.
- Do not create deep nested cards/panels when one container is enough.
- Do not add custom UI wrappers if an existing shadcn primitive fits.
- Do not use huge modals for small forms.

## Layout & Responsive Rules

- Mobile-first:
  - single-column by default
  - avoid horizontal overflow
- Tablet/Desktop:
  - move filters/actions to side/top rails only when space allows
- Use `gap-*` consistently; avoid manual margin chains.
- Keep sticky elements minimal and purposeful.
- Keep table views readable:
  - key columns first
  - truncate long strings with accessible full value affordance

## Component Rules (shadcn)

- Buttons:
  - one primary action per section
  - destructive style only for destructive actions
- Dialogs:
  - include clear title + outcome-focused actions
  - avoid long scrolling dialogs unless truly necessary
- Inputs:
  - label + validation + helper text in consistent order
- Tabs:
  - short labels, clear active contrast
- Alerts/Toasts:
  - concise messages
  - actionable error feedback where possible

## UX Rules (User-Friendly)

- Reduce click depth for common admin/user tasks.
- Keep wording plain and direct.
- Confirm destructive actions.
- Preserve user context after actions (don’t reset unrelated state).
- Show success/failure feedback immediately and clearly.

## Review Checklist

- shadcn-first implementation? ✅
- No decorative shadows? ✅
- Responsive at mobile/tablet/desktop? ✅
- Clear hierarchy and action priority? ✅
- Accessible labels/states/messages? ✅
- No unnecessary visual noise? ✅

