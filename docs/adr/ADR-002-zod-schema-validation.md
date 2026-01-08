# ADR-002: Zod Schema Validation

## Status
Accepted

## Context

The SDK needs to accept multiple parameters of different types for each MarketData API endpoint:
- Some parameters are mandatory, others optional
- Data must be validated and transformed before sending to the API
- Type safety is needed at both compile-time and runtime
- Response data needs validation to ensure API contract compliance

Without explicit validation, this can lead to:
- Runtime errors instead of early validation
- Inconsistency in type handling
- Difficult debugging when API responses change
- No runtime guarantees despite TypeScript types

## Decision

We use **Zod for explicit input and output validation** with a hierarchical schema structure:

### Schema Structure

```typescript
// Base parameter types
export interface MarketDataParams {
  format?: 'internal' | 'json';
  human?: boolean;
  // ... other universal params
}

// Endpoint-specific parameters with Zod validation
import { z } from 'zod';

export const StocksPricesParamsSchema = z.object({
  symbols: z.union([z.string(), z.array(z.string())]),
  format: z.enum(['internal', 'json']).optional(),
  human: z.boolean().optional(),
  // ... other params
});

export type StocksPricesParams = z.infer<typeof StocksPricesParamsSchema>;
```

### Input Validation

```typescript
// In resources/stocks/prices.ts
export async function prices(
  this: StocksResource,
  arg1: string | string[] | (StocksPricesParams & MarketDataParams),
  arg2: MarketDataParams = {},
): Promise<unknown> {
  const params = normalizeArgs(arg1, arg2, 'symbols');
  
  return this._fetch('stocks/prices/', params, {
    inputSchema: StocksPricesParamsSchema,  // Validates input
    regularSchema: StockPriceSchema,         // Validates output
    humanSchema: StockPriceHumanSchema,      // Validates human-readable output
    service: '/v1/stocks/prices/',
  });
}
```

### Output Validation

```typescript
// In resources/stocks/outputs.ts
export const StockPriceSchema = z.object({
  s: z.literal('ok'),
  symbol: z.array(z.string()),
  ask: z.array(z.number()),
  bid: z.array(z.number()),
  // ... other fields
});

export type StockPriceResponse = z.infer<typeof StockPriceSchema>;

export const StockPriceHumanSchema = z.object({
  s: z.literal('ok'),
  Symbol: z.array(z.string()),
  Ask: z.array(z.number()),
  Bid: z.array(z.number()),
  // ... human-readable field names
});

export type StockPriceHumanResponse = z.infer<typeof StockPriceHumanSchema>;
```

### Type Generation

Zod schemas serve as single source of truth for both validation and types:

```typescript
// Schema defines both validation and TypeScript type
const schema = z.object({ ... });
type Type = z.infer<typeof schema>;  // TypeScript type derived from schema
```

### Usage in BaseResource

```typescript
protected async _fetch<T>(
  path: string,
  params: MarketDataParams,
  options: {
    inputSchema?: z.ZodType;
    regularSchema: z.ZodType;
    humanSchema: z.ZodType;
    service: string;
  }
): Promise<T> {
  // Validate input params
  const validated = options.inputSchema?.parse(params) ?? params;
  
  // Determine which schema to use for response
  const schema = this._getSchema(validated, options.regularSchema, options.humanSchema);
  
  // Make request and validate response
  return this._makeRequest(path, validated, { schema, service });
}
```

### Benefits

**Early Validation**: Errors are detected before making the HTTP request

**Dual Type Safety**: Compile-time (TypeScript) + runtime (Zod) validation

**Self-Documentation**: Schemas are explicit and readable

**Type Inference**: Types automatically derived from schemas, no duplication

**Response Validation**: Ensures API responses match expected structure

**Discriminated Unions**: Type narrowing based on `format` parameter

## Consequences

### Positive
- Errors validated before making API requests
- Full type safety at compile-time and runtime
- Clear and autocomplete-friendly interface in IDEs
- Parameters and responses explicitly documented
- Easy to extend with new validations
- Single source of truth for types and validation
- Catches API contract violations early

### Negative
- Overhead of Zod validation (minimal but present)
- Learning curve for developers unfamiliar with Zod
- Schema definitions can be verbose
- Bundle size increase due to Zod library

### Mitigations
- Zod overhead is negligible for most use cases
- Clear documentation of Zod patterns
- Schemas organized in separate files for maintainability
- Tree-shaking ensures only used schemas are bundled

## Alternatives Considered

### Alternative 1: TypeScript types only (no runtime validation)
```typescript
interface StocksPricesParams {
  symbols: string | string[];
  format?: 'internal' | 'json';
}
```

**Pros**: Simpler, no runtime overhead
**Cons**: No runtime validation, API response mismatches undetected, no guarantee types match reality

### Alternative 2: Manual validation
```typescript
function validateParams(params: unknown) {
  if (!params.symbols) throw new Error('symbols required');
  if (Array.isArray(params.symbols) && params.symbols.length === 0) {
    throw new Error('symbols cannot be empty');
  }
  // ... more manual checks
}
```

**Pros**: No external dependency
**Cons**: Verbose, error-prone, no type inference, hard to maintain

### Alternative 3: JSON Schema with validation library
```typescript
const schema = {
  type: 'object',
  properties: { symbols: { type: 'string' } },
  required: ['symbols']
};
```

**Pros**: Framework agnostic, widely used
**Cons**: Separate from TypeScript types, no type inference, less integrated

### Alternative 4: io-ts
```typescript
const StocksPricesParamsCodec = t.type({
  symbols: t.union([t.string, t.array(t.string)]),
});
```

**Pros**: Similar features to Zod
**Cons**: More complex API, less ergonomic type inference, smaller community

## References

- [Zod Documentation](https://zod.dev/)
- [TypeScript Schema Validation](https://zod.dev/?id=basic-usage)
- Relevant files:
  - `src/resources/stocks/types.ts` - Input schemas
  - `src/resources/stocks/outputs.ts` - Output schemas
  - `src/resources/markets/types.ts` - Market input schemas
  - `src/resources/markets/outputs.ts` - Market output schemas
  - `src/resources/base.ts` - Schema usage in `_fetch` and `_getSchema`
