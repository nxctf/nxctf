# Code Standards

## Principles

- Keep code simple, typed, and explicit.
- Prefer predictable behavior over clever abstractions.
- Minimize duplicate logic and side effects.

## Do

- Use domain service classes (`XService`) for all boundary operations.
- Keep helper functions pure when possible.
- Keep modules focused on one responsibility.
- Use descriptive names for types/functions/variables.
- Add/adjust types when changing data contracts.

## Do Not

- Do not use `any` or `as any`.
- Do not proxy service methods from `lib` as aliases.
- Do not hide async side effects in utility functions.
- Do not mix architectural refactor with unrelated product behavior changes.

## Error Handling

- Convert unknown boundary errors into typed outcomes.
- Use consistent return envelopes for recoverable failures.
- Log boundary failures with contextual identifiers (method/entity).

## Import Discipline

- Import service classes directly from feature `services/`.
- Use type-only imports when possible (`import type`).
- Avoid cyclic dependencies across feature layers.

