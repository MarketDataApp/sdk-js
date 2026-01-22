# ADR-005: TypeScript Type System

## Status
Accepted

## Context

TypeScript provides a powerful type system that can enhance developer experience through:
- Compile-time type checking
- IDE autocomplete and IntelliSense
- Type narrowing and inference
- Function overloads for different calling patterns

The SDK needs to provide:
- Different function signatures for flexible API (positional vs object params)
- Type-safe return values that vary based on input parameters
- Automatic type narrowing based on `format` parameter
- Full type safety without forcing users to write type assertions

This is a TypeScript-specific concern with no direct equivalent in the Python SDK.

## Decision

We implemented a sophisticated type system using multiple TypeScript features:

### 1. Function Overloads

Provide multiple function signatures for ergonomic API usage:

```typescript
// In resources/stocks/prices.ts
export async function prices<
  P extends Omit<StocksPricesParams, 'symbols'> & MarketDataParams,
>(
  this: StocksResource,
  symbols: string | string[],
  params?: P,
): TypedResult<
  StockPriceResponse,
  StockPriceHumanResponse,
  P & { symbols: string | string[] }
>;

export async function prices<P extends StocksPricesParams & MarketDataParams>(
  this: StocksResource,
  params: P,
): TypedResult<StockPriceResponse, StockPriceHumanResponse, P>;

export async function prices(
  this: StocksResource,
  arg1: string | string[] | (StocksPricesParams & MarketDataParams),
  arg2: MarketDataParams = {},
): Promise<unknown> {
  // Implementation
}
```

**Benefits**:
- Users can call `prices('AAPL')` or `prices({ symbols: 'AAPL' })`
- Different parameter shapes supported with full type safety
- TypeScript knows exact parameter types for each overload

### 2. Conditional Return Types

Use `TypedResult` helper type for intelligent return type inference:

```typescript
// In types.ts
export type TypedResult<T, H, P> = 
  P extends { format: 'json' }
    ? Promise<unknown>
    : P extends { human: true }
      ? Promise<H>
      : Promise<T>;
```

**How it works**:
- If `format: 'json'` in params → return type is `Promise<unknown>` (raw JSON)
- Else if `human: true` in params → return type is `Promise<H>` (human-readable schema)
- Else → return type is `Promise<T>` (regular schema)

**Example**:
```typescript
// TypeScript infers: Promise<StockPriceResponse>
const result1 = await client.stocks.prices('AAPL');

// TypeScript infers: Promise<StockPriceHumanResponse>
const result2 = await client.stocks.prices('AAPL', { human: true });

// TypeScript infers: Promise<unknown>
const result3 = await client.stocks.prices('AAPL', { format: 'json' });
```

### 3. Discriminated Unions

Use discriminated unions for response types:

```typescript
// Regular response (format: 'internal', human: false)
export const StockPriceSchema = z.object({
  s: z.literal('ok'),
  symbol: z.array(z.string()),
  ask: z.array(z.number()),
  bid: z.array(z.number()),
  // ... lowercase field names
});

// Human-readable response (format: 'internal', human: true)
export const StockPriceHumanSchema = z.object({
  s: z.literal('ok'),
  Symbol: z.array(z.string()),
  Ask: z.array(z.number()),
  Bid: z.array(z.number()),
  // ... capitalized field names
});

export type StockPriceResponse = z.infer<typeof StockPriceSchema>;
export type StockPriceHumanResponse = z.infer<typeof StockPriceHumanSchema>;
```

**Benefits**:
- Clear separation between machine-readable and human-readable formats
- Type safety for field names
- Autocomplete shows correct field names based on `human` parameter

### 4. Schema-Driven Type Generation

Generate TypeScript types directly from Zod schemas:

```typescript
// Schema is single source of truth
export const StockCandleSchema = z.object({
  s: z.literal('ok'),
  t: z.array(z.number()),
  o: z.array(z.number()),
  h: z.array(z.number()),
  l: z.array(z.number()),
  c: z.array(z.number()),
  v: z.array(z.number()),
});

// Type automatically derived from schema
export type StockCandleResponse = z.infer<typeof StockCandleSchema>;
```

**Benefits**:
- No duplication between schemas and types
- Runtime validation and compile-time types stay in sync
- Single source of truth

### 5. Generic Type Constraints

Use generics with constraints for flexible yet type-safe code:

```typescript
export abstract class BaseResource {
  protected async _fetch<T>(
    path: string,
    params: MarketDataParams,
    options: {
      inputSchema?: z.ZodType;
      regularSchema: z.ZodType<T>;
      humanSchema: z.ZodType<T>;
      service: string;
    }
  ): Promise<T> {
    // Implementation
  }
  
  protected _getSchema<T>(
    params: MarketDataParams,
    regularSchema: z.ZodType<T>,
    humanSchema: z.ZodType<T>
  ): z.ZodType<T> {
    return params.human ? humanSchema : regularSchema;
  }
}
```

**Benefits**:
- Type parameter `T` ensures schema types match
- Compile-time verification that schemas return consistent types
- Flexible for different response types

### 6. Type Guards

Helper methods act as type guards for runtime checking:

```typescript
protected _getSchema<T>(
  params: MarketDataParams,
  regularSchema: z.ZodType<T>,
  humanSchema: z.ZodType<T>
): z.ZodType<T> {
  return params.human ? humanSchema : regularSchema;
}
```

**Benefits**:
- TypeScript narrows types based on runtime conditions
- Type-safe schema selection
- No manual type assertions needed

## Consequences

### Positive
- **Full type safety**: Compile-time errors for type mismatches
- **Excellent autocomplete**: IDE shows accurate types and field names
- **No type assertions**: Users don't need `as` casts
- **Flexible API**: Multiple calling patterns supported
- **Self-documenting**: Types serve as documentation
- **Refactoring safety**: Type errors caught when changing schemas

### Negative
- **Complex type signatures**: Function signatures can be intimidating
- **Learning curve**: Advanced TypeScript features may confuse beginners
- **Bundle size**: Type information (tiny in runtime, but exists in source)
- **Compilation overhead**: TypeScript type checking takes time

### Mitigations
- Comprehensive documentation explains type patterns
- Examples demonstrate common usage patterns
- Users can ignore types and still use the SDK (types don't affect runtime)
- Type complexity hidden in internal helpers

## Alternatives Considered

### Alternative 1: Simple union types without overloads
```typescript
function prices(
  arg1: string | string[] | StocksPricesParams,
  arg2?: MarketDataParams
): Promise<StockPriceResponse | StockPriceHumanResponse | unknown>;
```

**Pros**: Simpler type signatures
**Cons**: No automatic type narrowing, users must check types manually, poor autocomplete

### Alternative 2: Separate methods for each format
```typescript
function pricesInternal(...): Promise<StockPriceResponse>;
function pricesHuman(...): Promise<StockPriceHumanResponse>;
function pricesJson(...): Promise<unknown>;
```

**Pros**: Explicit types, simple
**Cons**: API duplication, more methods to maintain, inconsistent with parameter-based API

### Alternative 3: No type narrowing (always unknown)
```typescript
function prices(...): Promise<unknown>;
```

**Pros**: Simple, no complexity
**Cons**: No type safety, users must cast, defeats TypeScript benefits

### Alternative 4: Builder pattern
```typescript
client.stocks
  .prices()
  .withSymbols(['AAPL'])
  .asHumanReadable()
  .execute();
```

**Pros**: Fluent API, clear intent
**Cons**: Verbose, over-engineered for simple use case, unfamiliar pattern

## References

- [TypeScript Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- Relevant files:
  - `src/types.ts` - `TypedResult` helper type
  - `src/resources/base.ts` - Generic `_fetch` method
  - `src/resources/stocks/prices.ts` - Function overloads example
  - `src/resources/stocks/candles.ts` - Advanced overloads
  - `src/resources/stocks/outputs.ts` - Schema-driven types
