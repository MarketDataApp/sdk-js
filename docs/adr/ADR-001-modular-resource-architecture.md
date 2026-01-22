# ADR-001: Modular Resource Architecture

## Status
Accepted

## Context

The MarketData TypeScript SDK needs to provide access to multiple types of market data:
- **Stocks**: Stock prices, candles (OHLCV data)
- **Markets**: Market status and availability

Each domain has its own API endpoints, data types, and processing logic. When initiating the project, it was necessary to decide how to organize this functionality in a scalable, maintainable, and coherent way.

## Decision

We implemented a **Modular Resource Architecture** in TypeScript, where:

1. **Each domain is an independent resource class**: `StocksResource`, `MarketsResource`
2. **Resources are injected into the main client**: The `MarketDataClient` exposes each resource as a property
3. **Each resource is responsible for its own methods and endpoints**:
   - `client.stocks.prices()`
   - `client.stocks.candles()`
   - `client.markets.status()`

### Implementation

```typescript
// In client.ts
export class MarketDataClient implements IMarketDataClient {
  public readonly stocks: StocksResource;
  public readonly markets: MarketsResource;

  constructor(config: MarketDataConfig = {}) {
    // ... initialization ...
    this.stocks = new StocksResource(this);
    this.markets = new MarketsResource(this);
  }
}

// Usage
const client = new MarketDataClient({ token: 'YOUR_TOKEN' });
const prices = await client.stocks.prices('AAPL');
const status = await client.markets.status();
```

### Resource Structure

Each resource extends `BaseResource` which provides common functionality:

```typescript
// In resources/base.ts
export abstract class BaseResource {
  constructor(protected client: MarketDataClient) {}

  protected async _fetch<T>(
    path: string,
    params: MarketDataParams,
    options: FetchOptions
  ): Promise<T> {
    // Common fetch logic with validation, schema checking, etc.
  }

  protected async _run<T>(fn: () => Promise<T>): Promise<T> {
    // Common execution wrapper
  }
}

// In resources/stocks/index.ts
export class StocksResource extends BaseResource {
  public prices = prices.bind(this);
  public candles = candles.bind(this);
}

// In resources/markets/index.ts
export class MarketsResource extends BaseResource {
  public status = status.bind(this);
}
```

### Benefits

**Scalability**: New domains can be added as new resource classes without modifying the client

**Separation of Concerns**: Each resource fully handles its own domain

**API Consistency**: The interface is consistent and predictable for users

**Code Organization**:
- Each resource has its own directory: `src/resources/{stocks,markets}/`
- Within each directory, domain-specific methods and types

**Dependency Injection**: All resources receive a reference to the client, allowing shared state (headers, rate limits, logger, etc.)

**Type Safety**: TypeScript ensures correct types throughout the resource hierarchy

## Consequences

### Positive
- Modular and easy to maintain code
- Each resource is independently testable
- Scalable for adding new domains
- Clear and consistent API for SDK users
- Reusable common logic (headers, retry logic, rate limits)
- Full TypeScript type safety and autocomplete

### Negative
- Requires all resources to inherit from a consistent `BaseResource` class
- Need to maintain synchronization between client and resources
- Slightly more complex initialization compared to flat functions

### Mitigations
- `BaseResource` class standardizes the interface and provides helper methods
- TypeScript generics maintain flexibility while ensuring type safety
- Comprehensive unit tests for each resource

## Alternatives Considered

### Alternative 1: Direct functions on the client
```typescript
client.getStockPrices(...);
client.getMarketStatus(...);
```

**Pros**: Simpler initially
**Cons**: Client becomes monolithic, difficult to scale, lack of logical organization

### Alternative 2: Separate clients per domain
```typescript
const stocksClient = new StocksClient();
const marketsClient = new MarketsClient();
```

**Pros**: Maximum separation
**Cons**: User must manage multiple clients, duplication of authentication and header logic, difficult to maintain global rate limits

### Alternative 3: Namespace-based organization
```typescript
import * as stocks from 'marketdata/stocks';
stocks.prices(...);
```

**Pros**: Functional approach
**Cons**: No shared state, harder to manage rate limits and authentication, less discoverable API

## References

- [Pattern: Service Locator vs Dependency Injection](https://martinfowler.com/articles/injection.html)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- Code structure: `src/resources/`
- Main client: `src/client.ts`
- Base resource: `src/resources/base.ts`
