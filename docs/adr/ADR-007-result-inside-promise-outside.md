# ADR-007: Result Inside, Promise Outside

## Status
Accepted (2026-04-21). Supersedes [ADR-006](./ADR-006-result-pattern-neverthrow.md).

## Context

ADR-006 committed every public resource method to return `ResultAsync<T, MarketDataClientError>` via `MarketDataResult<T>` / `TypedResult<T, H, P>`. Review (issue #4, team discussion 2026-04-21) surfaced three problems with that contract:

1. **Non-idiomatic for JavaScript/TypeScript.** The official SDK requirements spec §6.4 defines the JS error pattern as "Reject promises / throw." No major JS SDK (Stripe, OpenAI, Anthropic, AWS) exposes Result types. A consumer wanting a single quote for SPY should not need to learn neverthrow.
2. **Leaks an implementation dependency into the public type surface.** Consumers that import our response types transitively import `ResultAsync`, `.match()`, `.isErr()`, `.unwrap()` — a dependency they did not opt into.
3. **Breaks `try/catch` + `await`.** The common flow (`try { const x = await client.stocks.prices("AAPL"); ... } catch (e) { ... }`) does not work when the returned Promise always resolves to a Result.

The benefits neverthrow provides internally — fan-out via `ResultAsync.combine`, composable retry, validation pipelines in `_fetch` and `_makeRequest` — are real and we want to keep them. The question is only where the boundary between "typed errors as values" and "throws on rejection" lives.

## Decision

**Result inside, Promise outside.** Keep neverthrow for all internal composition. Unwrap to a plain `Promise<T>` exactly once at every public method boundary so consumers see a familiar, throwing Promise.

### Boundary mechanism

Every public resource method returns a `MarketDataPromise<T>` that **extends** `Promise<T>`:

```ts
export class MarketDataPromise<T> extends Promise<T> {
  // .then/.catch/.finally return plain Promise (don't carry save/blob forward)
  static get [Symbol.species]() { return Promise; }

  static fromResult<T>(
    r: ResultAsync<T, MarketDataClientError>,
    saveBlobToFile: (blob: Blob, filename?: string) => Promise<string>,
  ): MarketDataPromise<T> {
    const mp = new MarketDataPromise<T>((resolve, reject) => {
      r.match(v => resolve(v), e => reject(e));
    });
    // attach saveBlobToFile for chainable .save()/.blob()
    return mp;
  }

  async blob(): Promise<Blob> { /* ... */ }
  async save(filename?: string): Promise<string> { /* ... */ }
}
```

Extending `Promise` (rather than moving `save`/`blob` to the resolved value) preserves the existing chainable call pattern `client.stocks.prices("AAPL").save("f.csv")` that users rely on without requiring an intermediate `await`. Overriding `Symbol.species` to plain `Promise` contains the classic subclassing footgun — `.then`/`.catch`/`.finally` chains return a standard `Promise<T>`, so transformed promises don't carry the extra methods.

### Public return types

`TypedPromise<T, H, P>` mirrors the old `TypedResult<T, H, P>` conditional narrowing (CSV → `Blob`, `human: true` → TitleCase response, default → internal response), but wrapped in `MarketDataPromise` instead of `ResultAsync`.

### Internal composition

`_makeRequest` (client.ts), `_executeWithRetry` (client.ts), `_fetch` (resources/base.ts), and the fan-out pipelines in `stocks.candles` / `options.quotes` all continue to return `ResultAsync<T, MarketDataClientError>`. `ResultAsync.combine`, `.andThen`, `.map`, `.mapErr` remain in regular use. Only the public wrappers call `MarketDataPromise.fromResult` to cross the boundary.

### Consumer API

```ts
// Plain await — throws on error
try {
  const candles = await client.stocks.candles({ symbol: "AAPL", resolution: "D", from: "2024-01-01" });
  console.log(candles.length);
} catch (err) {
  // err is MarketDataClientError (RequestError | ValidationError | RateLimitError | ...)
}

// Chainable save/blob still works
const path = await client.stocks.prices("AAPL", { format: "csv" }).save("prices.csv");
const blob = await client.stocks.prices("AAPL").blob();
```

## Consequences

### Positive

- **Idiomatic JS/TS.** Consumers write ordinary `try`/`catch` + `await`. No library-specific API to learn.
- **Spec-compliant.** Closes the compliance gap on requirements spec §6.4 and §Language-Idiomatic Design.
- **No leakage of `neverthrow` types** in the public surface. `dist/index.d.ts` does not mention `Result`, `ResultAsync`, `MarketDataResult`, or `TypedResult`.
- **Existing chainable calls preserved.** `client.stocks.x(...).save("f.csv")` works without an intermediate `await`.
- **Fan-out methods now have working `save`/`blob`.** `stocks.candles` and `options.quotes` previously cast to `TypedResult` but never attached `save`/`blob` at runtime (a type lie). The uniform wrapping via `MarketDataPromise.fromResult` closes that bug.
- **Internal composition unchanged.** Retry, rate-limit credit reservation, Zod validation, and fan-out pipelines keep their typed-error handling.

### Negative

- **`Promise` subclassing still has edge cases.** `Symbol.species = Promise` mitigates the worst of them (`.then`/`.catch`/`.finally` return plain `Promise`), but advanced usage like `Promise.all([mp1, mp2]).then(...)` discards `save`/`blob` on the combined promise. Acceptable — `save`/`blob` are meant for single-call chains, not aggregations.
- **`neverthrow` stays as a runtime dependency.** It's required for internal composition, so consumers still get it in `node_modules` (~5KB). They just no longer see it in the public API.
- **Two mental models for contributors.** Maintainers need to know we compose with `ResultAsync` internally and unwrap at the boundary. Documented in this ADR and the boundary helper's JSDoc.

### Migration impact

- All 12 public resource methods migrated from `TypedResult<T, H, P>` → `TypedPromise<T, H, P>`.
- `src/resources/base.ts::_fetch` flipped return type; `MarketDataPromise.fromResult` replaces the old `attachMarketDataMethods` helper.
- Fan-out methods (`stocks.candles`, `options.quotes`) wrap their `ResultAsync.combine(...).map(...)` output via `MarketDataPromise.fromResult`.
- All test files migrated from `.isErr`/`.value`/`.error`/`unwrapOk`/`._unsafeUnwrap` to `await` + `try`/`catch` + `await expect(...).rejects.toBeInstanceOf(...)`.
- `src/index.ts` switched from blanket re-export to an allow-list. `MarketDataResult`, `TypedResult`, `IMarketDataClient`, `MarketDataParams`, `attachMarketDataMethods` are no longer exported.

## Alternatives Considered

### Attach `save`/`blob` to the resolved response value

Move `save`/`blob` from the Promise to the awaited `T`: `const r = await client.stocks.prices(...); await r.save("f.csv")`. Avoids subclassing `Promise` entirely — cleaner type story — but breaks the existing chainable pattern and forces a double-await for every CSV/save call site. Rejected: the chainable API is in use across our own test suite and consumers likely to mirror it.

### Remove `neverthrow` entirely

Replace `ResultAsync.combine` in fan-outs with `Promise.allSettled` + a small aggregator; replace internal `.andThen` chains with standard `try`/`catch`. Simpler dependency story, but forfeits the typed-error pipeline in `_fetch` / `_makeRequest` that contributors benefit from. Rejected for now; worth revisiting if neverthrow internal usage thins out further.

### Keep ADR-006 (Result in the public API)

Document the non-idiomatic choice and accept the spec-compliance gap. Rejected — same error-handling anti-pattern the spec explicitly calls out in Python v1.x's `MarketDataClientErrorResult`.

## References

- Issue: MarketDataApp/sdk-js#4
- SDK requirements spec §6.4 and §Language-Idiomatic Design
- ADR-006 (superseded) — `docs/adr/ADR-006-result-pattern-neverthrow.md`
- Relevant files:
  - `src/utils.ts` — `MarketDataPromise`, `unwrap` helper
  - `src/types.ts` — `TypedPromise` conditional return type
  - `src/resources/base.ts` — `_fetch` returns `TypedPromise`
  - `src/resources/stocks/candles.ts`, `src/resources/options/quotes.ts` — fan-out boundary wrap
  - `src/client.ts` — `_makeRequest`, `_executeWithRetry` (unchanged, still Result-based)
