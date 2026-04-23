# ADR-006: Result Pattern with neverthrow

## Status
Superseded by [ADR-007](./ADR-007-result-inside-promise-outside.md) (2026-04-21).

> The public API no longer exposes `ResultAsync`. neverthrow is retained for internal composition only. See ADR-007 for the reversal rationale. This document is preserved as a historical record of the original decision.

## Context

Error handling is a critical aspect of SDK design. Traditional approaches include:

1. **Exceptions** - `throw`/`try`/`catch` pattern commonly used in JavaScript/TypeScript
2. **Error callbacks** - Node.js style `(err, result)` callbacks
3. **Result types** - Explicit success/failure representation inspired by functional languages

The SDK needs to:
- Provide type-safe error handling
- Make error paths explicit and discoverable
- Support functional composition of operations
- Allow users to handle errors gracefully without exceptions
- Integrate well with TypeScript's type system
- Maintain consistency across all API methods

## Decision

We use **neverthrow for functional error handling** with explicit Result types:

### Core Types

```typescript
import type { ResultAsync } from "neverthrow";
import type { MarketDataClientError } from "@/error";

export type MarketDataResult<T> = ResultAsync<T, MarketDataClientError>;

export type TypedResult<T, H, P> = MarketDataResult<
  P extends { useHumanReadable: true } | { human: true }
    ? stockRequestResult<H>
    : stockRequestResult<T>
>;
```

**`MarketDataResult<T>`**: 
- Wraps all SDK operations that can fail
- Success value: `T` (response data)
- Error value: `MarketDataClientError` (base error class)

**`TypedResult<T, H, P>`**:
- Conditional type based on parameters
- Returns human-readable or regular format

### neverthrow Library

[neverthrow](https://github.com/supermacro/neverthrow) provides:
- `ResultAsync<T, E>` - Asynchronous Result monad
- `ok(value)` - Create successful Result
- `err(error)` - Create failed Result
- `errAsync(error)` - Create failed ResultAsync
- `.match()` - Pattern matching on success/failure
- `.map()` / `.mapErr()` - Transform success/error values
- `.andThen()` - Chain operations (flatMap)
- `.combine()` - Combine multiple Results

### Implementation Patterns

#### Client Layer

```typescript
public _makeRequest<T>(
  path: string,
  params?: MarketDataParams,
  options?: {...}
): MarketDataResult<T> {
  return this._executeWithRetry<T>(...);
}

private _executeWithRetry<T>(...): MarketDataResult<T> {
  return ResultAsync.fromPromise(
    pRetry(() => this._performFetch(...), {...}),
    (e) => this._mapFetchError(e)
  );
}
```

**Pattern**: Wrap Promise-based operations with `ResultAsync.fromPromise()`
- First argument: Promise to execute
- Second argument: Error mapper function

#### Base Resource Layer

```typescript
protected _fetch<T, H, P>(...): TypedResult<T, H, P> {
  const normalization = this._validateAndNormalize(params, inputSchema);
  if (normalization.isErr()) {
    return errAsync(normalization.error) as TypedResult<T, H, P>;
  }
  
  return this._makeRequest<T | H>(...)
    .map((response) => getDataRecords(response, excludeKeys))
    as TypedResult<T, H, P>;
}

protected _validateAndNormalize<P>(
  params: P,
  schema: z.ZodType<unknown>
): Result<P, ValidationError> {
  const validationResult = schema.safeParse(params);
  if (!validationResult.success) {
    return err(new ValidationError(validationResult.error.message));
  }
  return ok(validationResult.data as P);
}
```

**Pattern**: Early return with `errAsync()` or `err()` for validation failures
**Pattern**: Transform success values with `.map()`

#### Concurrent Operations

```typescript
const requests = ranges.map((range) => 
  this._makeRequest<StockCandleResponse>(...) 
);

return ResultAsync.combine(requests).map((responses) => {
  const merged = this._mergeResponses(responses);
  return getDataRecords(merged);
}) as TypedResult<...>;
```

**Pattern**: Use `ResultAsync.combine()` to execute multiple operations
- Fails fast if any operation fails
- Returns array of success values if all succeed

#### Error Handling in Consumers

```typescript
const result = await globalApiStatus.refresh(client);

if (result.isErr()) {
  client.logger.error(`Failed to refresh: ${result.error.message}`);
  return;
}
```

**Pattern**: Check with `.isErr()` and access error via `.error`

### User-Facing API

Users have multiple options for handling Results:

#### Option 1: Match Pattern (Recommended)

```typescript
const result = await client.stocks.prices('AAPL');

result.match(
  (prices) => console.log('Success:', prices),
  (error) => console.error('Failed:', error.message)
);
```

#### Option 2: Unwrap (Throws on Error)

```typescript
try {
  const prices = await client.stocks.prices('AAPL').then(r => r.unwrap());
  console.log(prices);
} catch (error) {
  console.error('Failed:', error);
}
```

#### Option 3: Functional Composition

```typescript
const result = await client.stocks.prices('AAPL')
  .map((prices) => prices.filter(p => p.mid > 100))
  .mapErr((error) => new CustomError(error.message));

if (result.isOk()) {
  console.log(result.value);
}
```

#### Option 4: Chaining

```typescript
const result = await client.stocks.prices('AAPL')
  .andThen((prices) => {
    if (prices.length === 0) {
      return errAsync(new Error('No prices found'));
    }
    return okAsync(prices);
  });
```

## Consequences

### Positive

- **Explicit Error Handling**: Errors are part of the type signature, impossible to ignore
- **Type Safety**: TypeScript knows exact error types at compile time
- **Composability**: Functional operators (`.map()`, `.andThen()`) enable clean composition
- **No Hidden Exceptions**: All failure paths are explicit in return types
- **Pattern Matching**: `.match()` provides exhaustive handling of success/failure
- **Concurrent Safety**: `ResultAsync.combine()` handles multiple operations cleanly
- **Discoverable**: IDE autocomplete shows all Result methods
- **Testable**: Easy to test success and error paths separately

### Negative

- **Learning Curve**: Developers unfamiliar with Result types need to learn the pattern
- **Verbosity**: More verbose than simple `try/catch` for basic cases
- **Library Dependency**: Adds `neverthrow` as a required dependency (~5KB)
- **Async Complexity**: `ResultAsync` chain can be harder to debug than Promises
- **Mixed Paradigms**: Some users prefer exceptions, forcing a specific pattern

### Mitigations

- **Documentation**: Comprehensive examples in README and ADRs
- **`.unwrap()` Option**: Users can convert to exceptions if preferred
- **TypeScript Integration**: Full type inference reduces verbosity
- **Small Dependency**: neverthrow is lightweight and well-maintained
- **Gradual Adoption**: Users can start with `.unwrap()` and migrate to functional style

## Alternatives Considered

### Alternative 1: Traditional Exceptions

```typescript
async function prices(symbol: string): Promise<StockPriceResponse> {
  const response = await fetch(...);
  if (!response.ok) {
    throw new RequestError('Failed');
  }
  return response.json();
}
```

**Pros**: Familiar, simple, native to JavaScript
**Cons**: Hidden error paths, no compile-time guarantees, easy to forget `try/catch`

**Why Rejected**: Errors are not discoverable in type signature, easy to miss handling edge cases

### Alternative 2: Error Callbacks (Node.js Style)

```typescript
function prices(
  symbol: string, 
  callback: (err: Error | null, data?: StockPriceResponse) => void
): void {
  // ...
}
```

**Pros**: Explicit error parameter
**Cons**: Callback hell, not composable, not idiomatic for modern TypeScript

**Why Rejected**: Poor developer experience, doesn't leverage async/await

### Alternative 3: Custom Result Implementation

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

**Pros**: No external dependency, full control
**Cons**: Need to implement all utility methods, potential bugs, no community support

**Why Rejected**: neverthrow is battle-tested and provides rich functional operators

### Alternative 4: Tuple Returns

```typescript
async function prices(symbol: string): Promise<[Error | null, StockPriceResponse?]> {
  // ...
}
```

**Pros**: Simple, no library needed
**Cons**: No type narrowing, no composability, easy to access wrong tuple element

**Why Rejected**: Weak type safety, no functional operators

### Alternative 5: Either Monad (fp-ts)

```typescript
import { Either } from 'fp-ts/Either';

function prices(symbol: string): TaskEither<Error, StockPriceResponse> {
  // ...
}
```

**Pros**: Full functional programming ecosystem
**Cons**: Much larger dependency, steeper learning curve, over-engineered for use case

**Why Rejected**: neverthrow provides sufficient functionality with better ergonomics

## References

- [neverthrow Documentation](https://github.com/supermacro/neverthrow)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/)
- [Functional Error Handling](https://dev.to/glebec/four-ways-to-handle-errors-in-javascript-508a)
- Relevant files:
  - `src/types.ts` - `MarketDataResult` and `TypedResult` definitions
  - `src/client.ts` - `ResultAsync.fromPromise()` usage
  - `src/resources/base.ts` - `err()`, `ok()`, `errAsync()` usage
  - `src/resources/stocks/candles.ts` - `ResultAsync.combine()` for concurrent requests
  - `src/apiStatus.ts` - `.isErr()` and `.error` pattern
