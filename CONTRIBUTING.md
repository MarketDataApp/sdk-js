# Contributing

Short guide for working on the JavaScript/TypeScript Market Data SDK.

## Local setup

Requirements: Node ≥ 20, [pnpm](https://pnpm.io/) (`corepack enable` if missing).

```bash
git clone https://github.com/MarketDataApp/sdk-js.git
cd sdk-js
pnpm install
cp .env.example .env    # set MARKETDATA_TOKEN if you want authenticated endpoints
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm test` | Runs the mocked unit suite with vitest (no network). |
| `pnpm test:coverage` | Same, with v8 coverage → `coverage/`. |
| `pnpm test:integration` | Runs `tests/integration/*.integration.test.ts` against the live API. Requires `MARKETDATA_TOKEN` (or falls back to free-tier AAPL). |
| `pnpm typecheck` | `tsc --noEmit` — zero errors expected. |
| `pnpm lint` | Biome against `src` and `tests`. |
| `pnpm format` | Biome auto-fix formatting. |
| `pnpm build` | tsup dual CJS+ESM bundle into `dist/`. |

CI runs lint → typecheck → coverage → build on every PR, then a separate `integration` job against the live API on same-repo PRs and pushes to main.

## Branch naming

- `feat/<topic>` — new functionality
- `fix/<topic>` — bug fixes
- `chore/<topic>` — tooling, CI, dependency bumps
- `docs/<topic>` — documentation-only changes
- `refactor/<topic>` — behaviour-preserving rewrites

## Pull requests

- Keep PRs focused — one logical change per PR. Stack branches if a refactor spans phases.
- Include a "Verified" section in the PR description: which scripts you ran and what they reported.
- For public API changes: open or update an ADR under `docs/adr/` in the same PR. ADRs are immutable once accepted — supersede rather than rewrite.
- Run `pnpm format` before pushing.

## Architecture Decision Records

Decisions that shape the public API or the internal shape of the SDK are recorded in `docs/adr/`. Read the existing set before proposing a change to error handling, rate-limiting, retry logic, or the Promise/Result boundary.

## Reporting a bug or requesting a feature

Open an issue at <https://github.com/MarketDataApp/sdk-js/issues> with:

1. SDK version (`package.json` `version` field, or `npm ls marketdata-sdk` output).
2. Node version (`node --version`).
3. Minimal reproduction (15 lines or fewer ideally).
4. For API-level errors: the full `support_info` string from the thrown error.
