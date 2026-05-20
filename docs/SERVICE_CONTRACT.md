# Service Contract (Class-Only)

## Required Shape

Each service file must expose:

- `export class XService { ... }`
- static public methods only
- exported domain types (DTO/result types) as needed

No top-level operational function exports.

## Method Requirements

Every public static method must:

- have explicit input/output types
- normalize external data before returning
- avoid returning raw untyped payloads
- avoid UI concerns (no toast, no component state)

## Boundary Handling

- RPC/HTTP errors must be handled consistently.
- Define typed RPC response objects where fields are optional/unknown.
- Convert nullable/unknown fields into stable domain values.

## Return Conventions

- Reads: return typed data or safe fallback (`[]`/`null`).
- Mutations: return typed status objects or throw only when caller must branch.

## Review Checklist

- Class-only export? ✅
- No `any` / `as any`? ✅
- Explicit public method signatures? ✅
- Typed boundary normalization? ✅
- No lib alias wrappers? ✅

