# Contributing to the Market Data JavaScript SDK

Thank you for your interest in contributing!

## Reporting Bugs

Use the [bug report template](https://github.com/MarketDataApp/sdk-js/issues/new?template=bug.yml) and provide:

1. **Endpoint and method** — which SDK method has the bug (e.g. `client.stocks.candles`)
2. **Reproduction code** — complete, runnable TypeScript or JavaScript that demonstrates the issue
3. **Expected vs actual behavior** — what should happen vs what does happen
4. **Environment** — SDK version, Node.js version, package manager (pnpm/npm/yarn), OS

### What Makes a Good Bug Report

- **Self-contained code**: your reproduction should run without modification
- **Minimal example**: remove unrelated code
- **Specific output**: include exact error messages, stack traces, or incorrect values
- **Types matter**: if the bug is a type-level issue, paste the TypeScript error verbatim

### What Happens Next

1. **Validation**: we review the reproduction and confirm the bug
2. **Test first**: a failing Vitest case is written that captures the bug
3. **Fix**: the minimal fix is implemented
4. **Verification**: the test passes and no regressions are introduced

If we need more information, we'll comment on the issue. Issues without a response within 7 days may be closed.

## Code Contributions

### Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b fix/your-bug-description`

This project uses [pnpm](https://pnpm.io/) as the package manager. The `examples/` directory is a sibling pnpm workspace package — running `pnpm install` from the repo root installs both.

### Development Guidelines

- **Node version**: code must work on Node.js 20.x and 22.x (the CI matrix)
- **Language**: source is TypeScript targeting ES2020; the published package ships both ESM and CJS builds
- **Code style**: run `pnpm format` before committing (Biome handles lint + format)
- **Type safety**: `pnpm typecheck` must pass with zero errors
- **Testing**: all changes require Vitest tests; new code should be fully covered
- **Schema validation**: request inputs and API responses are validated with Zod — keep schemas in sync with the [Market Data API docs](https://www.marketdata.app/docs)
- **Architecture**: read the [ADRs](./docs/adr/) before introducing new patterns (resource layout, retry/rate-limit behavior, Result-pattern interop, etc.)

### Testing

```bash
# Run the full test suite
pnpm test

# Run with coverage
pnpm test:coverage

# Type-check only
pnpm typecheck

# Lint
pnpm lint
```

Tests do not require a `MARKETDATA_TOKEN`; network calls are mocked. If you add tests that hit the live API, gate them on the token and skip when it's unset so CI stays green.

### Pull Requests

1. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass locally — `pnpm prepublishOnly` runs the same chain plus a build
2. Add tests for any new functionality
3. Update the README and relevant ADR(s) if behavior or public API changes
4. Add an entry under `## [Unreleased]` in [CHANGELOG.md](./CHANGELOG.md)
5. Keep commits focused and atomic
6. Reference any related issues in the PR description

## Finding Bugs

Want to help find bugs before other users encounter them? See [`.github/BUG_FINDING.md`](.github/BUG_FINDING.md) for a systematic exploration workflow:

- Prioritized areas where bugs commonly occur
- Test scenarios with runnable TypeScript snippets
- Endpoint-specific checklists
- Instructions for documenting and submitting found bugs

Found bugs are submitted via the standard [bug report template](https://github.com/MarketDataApp/sdk-js/issues/new?template=bug.yml).

## For Maintainers

If you have write access to the repository:

- [`.github/ISSUE_WORKFLOW.md`](.github/ISSUE_WORKFLOW.md) — issue triage and resolution process (validation checklist, response templates, label definitions, `gh` CLI commands)
- [`.github/RELEASE_PROCESS.md`](.github/RELEASE_PROCESS.md) — pre-release gate, version bump checklist, npm publish steps, rollback plan

## Questions?

- [GitHub Issues](https://github.com/MarketDataApp/sdk-js/issues) for bugs and feature requests
- [Discord](https://discord.com/invite/GmdeAVRtnT) for community chat
