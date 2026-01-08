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

```typescript
try {
  const prices = await client.stocks.prices('AAPL');
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

## License

MIT

## Links

- [MarketData API Documentation](https://www.marketdata.app/docs)
- [npm Package](https://www.npmjs.com/package/marketdata-sdk)
- [GitHub Repository](https://github.com/MarketDataApp/sdk-js)
