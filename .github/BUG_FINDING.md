# Bug Finding Workflow

This document defines a systematic process for proactively discovering bugs in the Market Data JavaScript SDK through codebase exploration and testing.

> **IMPORTANT: Every bug found MUST be submitted as a GitHub issue.**
>
> Do NOT just document bugs in markdown files, notes, or comments. Each bug must result in an actual GitHub issue created via:
> - **CLI**: `gh issue create --label "bug" --title "[Bug]: ..." --body "..."`
> - **Web**: [Create Bug Report](https://github.com/MarketDataApp/sdk-js/issues/new?template=bug.yml)
>
> A bug hunt is not complete until all discovered bugs exist as GitHub issues.

## Overview

**Purpose**: Proactive bug discovery vs reactive bug processing

- **BUG_FINDING.md** (this document): Find bugs before users encounter them
- **ISSUE_WORKFLOW.md**: Process bug reports submitted by users

**Workflow**: Find Bug → **Create GitHub Issue (REQUIRED)** → [ISSUE_WORKFLOW.md] → Fix

Each bug found MUST result in a GitHub issue. No exceptions.

**When to use this document**:
- QA passes before releases
- Pre-release validation
- Exploratory testing sessions
- After significant refactors
- When onboarding to understand edge cases

---

## Prerequisites

### Environment Setup

```bash
# Required
pnpm install
node -v  # Must be 20.x or 22.x

# API token for live testing
export MARKETDATA_TOKEN="your_token_here"
```

### Baseline Verification

Before hunting for bugs, confirm the test suite and types are clean:

```bash
pnpm typecheck
pnpm test
```

If anything fails, fix those issues first. Bug finding assumes a working baseline.

### Architecture Understanding

Familiarize yourself with key modules in `src/`:
- `client.ts` — `MarketDataClient`, the main entry point
- `resources/base.ts` — shared request/retry/rate-limit machinery
- `resources/{stocks,options,markets,funds,utilities}/` — endpoint implementations and Zod schemas
- `settings.ts` / `internalSettings.ts` — token, base URL, retry, and version resolution
- `error.ts` — `MarketDataClientError`, `ValidationError`, `RateLimitError`, `RequestError`
- `params.ts`, `utils.ts`, `fileUtils.ts` — parameter shaping, date splitting, `.save()` / `.blob()` helpers

---

## Exploration Areas

Prioritized by historical bug likelihood:

| Priority | Area | Bug Likelihood | Common Issues |
|----------|------|----------------|---------------|
| 1 | Response Format Handling | High | CSV vs JSON shape mismatches, `human` key renames |
| 2 | Array & Optional Field Boundaries | High | Empty arrays, missing optional fields, Zod failures |
| 3 | Concurrent / Date-Split Requests | Medium | Partial failures, chunk boundaries, merged headers |
| 4 | Date/Time Parsing | Medium | `Date` vs string vs unix int, timezone offsets |
| 5 | Multi-Symbol Operations | Medium | Empty arrays, duplicates, case sensitivity |
| 6 | TypeScript Types vs Runtime | Medium | Compile-time types drift from Zod / API reality |

---

## Area 1: Response Format Handling

### What Can Go Wrong

- Typed access fails when `format: 'csv'` returns a string instead of objects
- `human: true` returns different key names (PascalCase) than default (camelCase) — caller code expecting one may break on the other
- Optional fields present in JSON but absent in CSV

### Test Scenarios

#### 1.1 Format Switching

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();

// Default JSON
const json = await client.stocks.candles('AAPL', {
  resolution: '1D', from: new Date('2024-01-02'), to: new Date('2024-01-03'),
});

// CSV
const csv = await client.stocks.candles('AAPL', {
  resolution: '1D', from: new Date('2024-01-02'), to: new Date('2024-01-03'),
  format: 'csv',
});

// Verify: types match what's actually returned; no TypeError when accessing fields
// Bug indicator: TypeError on csv[0].close, or Zod ValidationError parsing CSV
```

#### 1.2 Human-Readable JSON

```typescript
const regular = await client.stocks.prices('AAPL');
const human = await client.stocks.prices('AAPL', { human: true });

// regular[0].mid vs human[0].Mid
// Verify: all fields present in both; key renames are consistent and documented
// Bug indicator: missing fields in one mode, inconsistent capitalization
```

### Red Flags

- `TypeError: Cannot read properties of undefined`
- `ZodError: Invalid input` when the API itself returned valid data
- Field present in one format but missing in another for the same call
- `.save()` or `.blob()` producing empty output

### Pass/Fail Criteria

| Scenario | Pass | Fail |
|----------|------|------|
| JSON format | Returns typed objects with all fields | Missing fields or Zod failure |
| CSV format | Returns parseable string/object as documented | Type mismatch or parse error |
| Human-readable | Same data as regular JSON under renamed keys | Missing data or field drift |

---

## Area 2: Array & Optional Field Boundaries

### What Can Go Wrong

- Accessing `[0]` on an empty result without check
- Optional fields parsed as `undefined` vs `null` inconsistently
- Single-item vs multi-item responses returning different shapes
- Zod schemas rejecting valid `null`s when they should allow them

### Test Scenarios

#### 2.1 Empty Results

```typescript
// Weekend date range — markets closed
const result = await client.stocks.candles('AAPL', {
  resolution: '1D',
  from: new Date('2024-01-06'),
  to: new Date('2024-01-07'),
});

// Verify: empty arrays returned cleanly
// Bug indicator: throws, returns null instead of [], or Zod rejects
console.log(result.length); // expect 0
```

#### 2.2 Missing Optional Fields

```typescript
// Earnings often have null/missing actual EPS, etc.
const earnings = await client.stocks.earnings('AAPL', { from: new Date('2024-01-01') });

// Verify: optional fields are present (possibly null) without crash
// Bug indicator: ValidationError on legitimate API response
```

### Red Flags

- `TypeError: Cannot read properties of undefined (reading '0')`
- `ZodError` against an API response that the docs say is valid
- Inconsistent `null` vs `undefined` for the same field across calls

### Pass/Fail Criteria

| Scenario | Pass | Fail |
|----------|------|------|
| Empty array | Returns `[]`, no error | Throws or returns wrong shape |
| Single item | Same array shape as multi-item | Type changes with count |
| Missing optional | `null`/`undefined` without error | Validation failure |

---

## Area 3: Concurrent / Date-Split Requests

### What Can Go Wrong

The SDK splits large date ranges into year-sized chunks and fetches them in parallel (see `resources/base.ts` and `utils.ts`). Things to probe:

- Partial failures swallowed — one chunk errors, others succeed
- Duplicate candles at chunk boundaries
- Rate-limit headers from the last response shadowing earlier ones
- Off-by-one at the split boundary (Dec 31 vs Jan 1)

### Test Scenarios

#### 3.1 Multi-Year Range (triggers splitting)

```typescript
const candles = await client.stocks.candles('AAPL', {
  resolution: '1H',
  from: new Date('2022-01-01'),
  to: new Date('2024-12-31'),
});

// Verify: no duplicate timestamps, no gaps at year boundaries
const ts = candles.map(c => c.t);
const dupes = ts.filter((t, i) => ts.indexOf(t) !== i);
console.log('duplicates:', dupes.length); // expect 0
```

#### 3.2 Rate-Limit Visibility After Split

```typescript
await client.stocks.candles('AAPL', {
  resolution: '1D',
  from: new Date('2020-01-01'),
  to: new Date('2024-12-31'),
});

console.log(client.rateLimits);
// Bug indicator: only reflects one chunk, or stale values
```

### Red Flags

- Missing chunks without error
- Duplicate rows at year boundaries
- Rate-limit counters that don't move after multiple chunked calls

### Pass/Fail Criteria

| Scenario | Pass | Fail |
|----------|------|------|
| Multi-year split | Complete, deduplicated data | Gaps or duplicates |
| Partial failure | Clear error or documented behavior | Silent data loss |
| Rate limits | Reflects most-recent server values | Stale or missing |

---

## Area 4: Date/Time Parsing

### What Can Go Wrong

The SDK accepts `Date` objects, ISO strings, and unix timestamps in some places. Probe each form per endpoint.

### Test Scenarios

#### 4.1 Input Format Equivalence

```typescript
const inputs = [
  new Date('2024-01-02'),
  '2024-01-02',
  1704153600,
];

for (const from of inputs) {
  const r = await client.stocks.candles('AAPL', {
    resolution: '1D', from, to: new Date('2024-01-03'),
  });
  console.log(typeof from, r.length);
}

// Verify: all forms produce identical results
// Bug indicator: silently different data or rejection of one form
```

#### 4.2 Year Boundaries

```typescript
const r = await client.stocks.candles('AAPL', {
  resolution: '1D',
  from: new Date('2023-12-29'),
  to: new Date('2024-01-03'),
});
// Verify: continuous data across year change
```

### Red Flags

- One date form rejected by Zod when others succeed
- Timestamps offset by exactly N hours (timezone bug)
- Gaps at year/month boundaries

---

## Area 5: Multi-Symbol Operations

### What Can Go Wrong

- Empty `symbols: []` array — crash vs empty result vs API error
- Duplicate symbols — wasted requests or duplicate rows
- Lowercase vs uppercase — different behavior

### Test Scenarios

```typescript
// Empty
const empty = await client.stocks.prices([]);

// Duplicates
const dup = await client.stocks.prices(['AAPL', 'AAPL', 'GOOGL']);

// Case
const upper = await client.stocks.prices('AAPL');
const lower = await client.stocks.prices('aapl');
```

### Pass/Fail Criteria

| Scenario | Pass | Fail |
|----------|------|------|
| Empty array | Empty result or clear `ValidationError` | Cryptic crash |
| Duplicates | Deduplicated or documented behavior | Duplicate rows |
| Case | Consistent results | Case-dependent failures |

---

## Area 6: TypeScript Types vs Runtime

JavaScript SDK-specific. The compile-time types must stay in sync with Zod schemas and actual API responses.

### What Can Go Wrong

- Type says a field is required but API can return it `null` → runtime crash on consumers
- `z.infer<>` drift after a schema change — exported `.d.ts` no longer matches runtime
- `OutputFormat`/method overloads that promise object output but return string under `format: 'csv'`

### Test Scenarios

#### 6.1 Type vs Runtime Audit

For each resource module:
1. Read `types.ts` and the matching Zod schema.
2. Make a live call.
3. Compare keys: does every required type-level field actually appear at runtime?
4. Compare nullability.

#### 6.2 Build-Time Smoke

```bash
pnpm build
node -e "const m = require('./dist/index.cjs'); console.log(Object.keys(m));"
# Bug indicator: missing exports, wrong shape in published artifact
```

### Red Flags

- TS reports a field as non-nullable but runtime returns `null`
- A field exists in `types.ts` but Zod never validates it (or vice versa)
- ESM vs CJS exports diverging

---

## Bug Documentation

When you find a bug, you MUST create a GitHub issue. Do not just note it.

### Required Information

1. **Minimal reproduction code** — smallest TS/JS that demonstrates the bug
2. **Expected behavior**
3. **Actual behavior** (include stack trace and full error)
4. **Environment**:
   - SDK version: `pnpm list marketdata-sdk` (or `npm ls`)
   - Node version: `node -v`
   - Package manager: pnpm / npm / yarn
   - OS: macOS/Windows/Linux

### Creating the GitHub Issue (REQUIRED)

**Option 1: CLI (Preferred)**

```bash
gh issue create --label "bug" --title "[Bug]: Brief description" --body "$(cat <<'EOF'
## API Documentation Verification
- [x] I have reviewed the [API documentation](https://www.marketdata.app/docs/api) for this endpoint
- [x] The behavior I'm reporting differs from what the API documentation describes

## SDK Endpoint
stocks

## Method
candles

## Reproduction Code
```ts
import { MarketDataClient } from 'marketdata-sdk';
// minimal repro here
```

## Expected Behavior
What should happen

## Actual Behavior
What actually happens (include error message and stack trace)

## SDK Version
1.0.0

## Node Version
20.x

## Additional Context
Found via BUG_FINDING.md [Area N]

Location: `src/path/to/file.ts:LINE`
EOF
)"
```

**Option 2: Web Form**

1. Go to [Create Bug Report](https://github.com/MarketDataApp/sdk-js/issues/new?template=bug.yml)
2. Fill out ALL fields
3. In "Additional Context", note: `Found via BUG_FINDING.md [Area N]`
4. Submit

> **The bug hunt is NOT complete until the GitHub issue URL exists.**

---

## Endpoint Checklists

### Stocks

| Method | Area 1 | Area 2 | Area 3 | Area 4 | Area 5 | Area 6 |
|---|---|---|---|---|---|---|
| `prices` | [ ] JSON [ ] CSV | [ ] Empty | N/A | N/A | [ ] Multi [ ] Dupe [ ] Case | [ ] Types |
| `candles` | [ ] JSON [ ] CSV | [ ] Empty [ ] Optional | [ ] Split [ ] RateLimits | [ ] Formats [ ] Boundaries | N/A | [ ] Types |
| `quotes` | [ ] JSON [ ] CSV | [ ] Empty | N/A | N/A | [ ] Multi [ ] Dupe [ ] Case | [ ] Types |
| `earnings` | [ ] JSON [ ] CSV | [ ] Empty [ ] Optional | N/A | [ ] Formats | N/A | [ ] Types |
| `news` | [ ] JSON [ ] CSV | [ ] Empty | N/A | [ ] Formats | [ ] Multi | [ ] Types |

### Options

| Method | Area 1 | Area 2 | Area 3 | Area 4 | Area 6 |
|---|---|---|---|---|---|
| `expirations` | [ ] JSON [ ] CSV | [ ] Empty | N/A | [ ] Formats | [ ] Types |
| `strikes` | [ ] JSON [ ] CSV | [ ] Empty | N/A | [ ] Formats | [ ] Types |
| `chain` | [ ] JSON [ ] CSV | [ ] Empty | N/A | [ ] Formats | [ ] Types |
| `quotes` | [ ] JSON [ ] CSV | [ ] Empty | [ ] Headers | N/A | [ ] Types |
| `lookup` | [ ] JSON [ ] CSV | [ ] Empty | N/A | N/A | [ ] Types |

### Markets

| Method | Area 1 | Area 2 | Area 4 |
|---|---|---|---|
| `status` | [ ] JSON [ ] CSV | [ ] Empty | [ ] Formats |

### Funds

| Method | Area 1 | Area 2 | Area 4 |
|---|---|---|---|
| `candles` | [ ] JSON [ ] CSV | [ ] Empty [ ] Single | [ ] Formats [ ] Boundaries |

### Utilities

| Method | Area 1 | Area 2 |
|---|---|---|
| `headers` | [ ] JSON | N/A |
| `status` | [ ] JSON | N/A |
| `user` | [ ] JSON | N/A |

---

## Quick Reference

### Common Bug Indicators

| Error / Symptom | Likely Area | Likely Cause |
|---|---|---|
| `TypeError: Cannot read properties of undefined` | Area 2 | Empty array / missing optional access |
| `ZodError: Invalid input` | Area 1/2/6 | Schema vs API drift |
| Same call yields different data on retry | Area 3 | Chunk boundary / partial failure |
| Type-level field undefined at runtime | Area 6 | Type/Zod drift |
| `.save()` writes empty file | Area 1 | CSV stream not flushed / wrong format branch |
| Stale `client.rateLimits` | Area 3 | Header merge after split |

### Links

- [Bug Report Template](https://github.com/MarketDataApp/sdk-js/issues/new?template=bug.yml)
- [Issue Workflow (for processing bugs)](ISSUE_WORKFLOW.md)

---

## Completion Checklist

Before considering a bug hunt complete:

- [ ] All discovered bugs have been created as GitHub issues (not just documented)
- [ ] Each issue has a URL (e.g., `https://github.com/MarketDataApp/sdk-js/issues/123`)
- [ ] Each issue follows the bug template format
- [ ] Each issue includes `Found via BUG_FINDING.md [Area N]` in Additional Context

**If you documented bugs but did not create GitHub issues, the bug hunt is NOT complete.**
