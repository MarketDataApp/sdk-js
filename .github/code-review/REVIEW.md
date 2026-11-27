@include default
@include sdk

## 9. The public surface of this SDK

The surface is every name exported from `src/index.ts`, and the types those
names carry into the generated `dist/index.d.ts`. The package is installed by
customers as `@marketdata/sdk`, and it ships both ESM and CJS entry points. A
name that `src/index.ts` does not export is not surface, whatever its file does.

TypeScript types are part of the surface. A change that compiles here and stops
a customer's `tsc` is breaking.

Breaking, for this SDK:

- an export removed or renamed, including a type-only export
- a parameter made required, or added as a required parameter
- a required field added to an options object, or an existing field retyped
- a parameter type narrowed, or a return type widened
- a member removed from a union that callers `switch` on, or a member added to a
  union that callers exhaustively switch on
- a discriminant value changed on a tagged union
- an `enum` member removed, or its value changed
- an entry point removed from `exports` in `package.json`

Not breaking: a new export, a new optional field on an options object, a new
optional parameter at the end, a widened parameter type.

`package.json` carries the version, and the release workflow sets it. Declare
the bump in `CHANGELOG.md` and in the pull request description; do not ask the
author to edit `package.json`.
