# MarketData TypeScript SDK

TypeScript/JavaScript SDK for the MarketData API - Real-time and historical market data for stocks, options, and more.

## Installation

```bash
npm install marketdata-sdk
# or
yarn add marketdata-sdk
# or
pnpm add marketdata-sdk
```

## Quick Start

```typescript
import { MarketDataClient } from 'marketdata-sdk';

// Initialize client
const client = new MarketDataClient({ 
  token: 'YOUR_API_TOKEN'  // Optional - runs in demo mode without token
});

// Get stock prices
const prices = await client.stocks.prices('AAPL');
console.log(prices.mid);  // [150.25]

// Get historical candles
const candles = await client.stocks.candles('AAPL', {
  resolution: '1H',
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31')
});

// Get market status
const status = await client.markets.status();
```

## Features

- ✅ **Full Type Safety** - Complete TypeScript types with intelligent autocomplete
- ✅ **Automatic Retries** - Built-in retry logic with exponential backoff
- ✅ **Rate Limiting** - Automatic rate limit tracking and enforcement
- ✅ **Service Status Checking** - Proactive service availability checks
- ✅ **Flexible API** - Multiple calling patterns (positional or object parameters)
- ✅ **Schema Validation** - Runtime validation with Zod
- ✅ **Concurrent Requests** - Automatic date range splitting for large queries

## Documentation

### Resources

- **[Stocks Resource](docs/stocks.md)** - Stock prices and candles (OHLCV data)
  - `prices()` - Get current stock prices
  - `candles()` - Get historical OHLCV data with automatic date splitting
- **[Markets Resource](docs/markets.md)** - Market status and availability
  - `status()` - Get current market status

### Architecture Decision Records (ADRs)

Detailed documentation of architectural decisions and implementation patterns:

- **[ADR-001: Modular Resource Architecture](docs/adr/ADR-001-modular-resource-architecture.md)** - How resources are organized and structured
- **[ADR-002: Zod Schema Validation](docs/adr/ADR-002-zod-schema-validation.md)** - Input/output validation strategy
- **[ADR-003: Retry Logic and Service Status](docs/adr/ADR-003-retry-logic-and-service-status.md)** - Intelligent retry mechanism and status checking
- **[ADR-004: Rate Limiting Strategy](docs/adr/ADR-004-rate-limiting-strategy.md)** - Proactive rate limit  tracking and enforcement
- **[ADR-005: TypeScript Type System](docs/adr/ADR-005-typescript-type-system.md)** - Advanced TypeScript patterns and type safety
- **[ADR-006: Result Pattern with neverthrow](docs/adr/ADR-006-result-pattern-neverthrow.md)** - Functional error handling with Result types

## Configuration

```typescript
const client = new MarketDataClient({
  token: 'YOUR_API_TOKEN',           // Optional
  baseUrl: 'https://api.marketdata.app',  // Optional
  apiVersion: 'v1',                   // Optional
  maxRetries: 3,                      // Optional, default: 3
  retryInitialWait: 0.5,             // Optional, default: 0.5 seconds
  retryMaxWait: 5,                    // Optional, default: 5 seconds
  retryFactor: 2,                     // Optional, default: 2
  logger: customLogger,               // Optional, custom logger
  debug: false                        // Optional, enable debug logging
});
```

## Examples

### Stock Prices

```typescript
// Single symbol
const price = await client.stocks.prices('AAPL');

// Multiple symbols
const prices = await client.stocks.prices(['AAPL', 'GOOGL', 'MSFT']);

// With human-readable format
const humanPrices = await client.stocks.prices('AAPL', { human: true });
console.log(humanPrices.Symbol);  // ['AAPL']
console.log(humanPrices.Mid);     // [150.25]

// Raw JSON
const json = await client.stocks.prices('AAPL', { format: 'json' });
```

### Stock Candles

```typescript
// Daily candles
const daily = await client.stocks.candles('AAPL');

// Hourly candles with date range
// Automatically splits into year-long chunks and fetches concurrently
const hourly = await client.stocks.candles('AAPL', {
  resolution: '1H',
  from: new Date('2023-01-01'),
  to: new Date('2024-12-31')
});

// With countback
const last100 = await client.stocks.candles('AAPL', { countback: 100 });

// Human-readable format
const humanCandles = await client.stocks.candles('AAPL', { human: true });
console.log(humanCandles.Date);   // Timestamps
console.log(humanCandles.Open);   // Opening prices
console.log(humanCandles.Close);  // Closing prices
```

### Rate Limit Monitoring

```typescript
// Access rate limit information
if (client.rateLimits) {
  console.log(`Requests remaining: ${client.rateLimits.requestsRemaining}`);
  console.log(`Resets at: ${new Date(client.rateLimits.requestsReset * 1000)}`);
}
```

## Error Handling

The SDK uses the Result pattern via [neverthrow](https://github.com/supermacro/neverthrow) for functional, type-safe error handling. All methods return `MarketDataResult<T>` which explicitly represents success or failure.

### Functional Pattern (Recommended)

```typescript
const result = await client.stocks.prices('AAPL');

result.match(
  (prices) => console.log('Success:', prices.mid),
  (error) => console.error('Failed:', error.message)
);
```

### Checking Results

```typescript
const result = await client.stocks.prices('AAPL');

if (result.isOk()) {
  console.log('Prices:', result.value);
} else {
  console.error('Error:', result.error.message);
}
```

### Exception-Based (Alternative)

If you prefer traditional exceptions, use `.unwrap()`:

```typescript
try {
  const result = await client.stocks.prices('AAPL');
  const prices = result.unwrap();
  console.log(prices);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof RequestError) {
    console.error('Request failed, retries exhausted');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Functional Composition

```typescript
const result = await client.stocks.prices('AAPL')
  .map((prices) => prices.filter(p => p.mid > 100))
  .mapErr((error) => {
    console.error('Failed to fetch:', error.message);
    return error;
  });

if (result.isOk()) {
  console.log('Filtered prices:', result.value);
}
```

### Chaining Operations

```typescript
const result = await client.stocks.prices('AAPL')
  .andThen((prices) => {
    if (prices.length === 0) {
      return errAsync(new Error('No prices found'));
    }
    return okAsync(prices);
  });
```

For more details, see [ADR-006: Result Pattern with neverthrow](docs/adr/ADR-006-result-pattern-neverthrow.md).


## License

MIT

## Links

- [MarketData API Documentation](https://www.marketdata.app/docs)
- [npm Package](https://www.npmjs.com/package/marketdata-sdk)
- [GitHub Repository](https://github.com/MarketDataApp/sdk-js)
