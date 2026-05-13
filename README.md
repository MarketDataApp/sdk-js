# MarketData TypeScript SDK

TypeScript/JavaScript SDK for the MarketData API - Real-time and historical market data for stocks, options, and more.

## Installation

**Prerequisites**: Node.js v20 or higher. The SDK targets ES2020.

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
console.log(prices[0].mid);  // 150.25

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

## Runnable examples

End-to-end scripts live under [`examples/`](./examples/) as a sibling pnpm workspace package. Install once, then run any of:

| Script | Command | What it does |
|---|---|---|
| [Lightweight Charts](./examples/charts/lightweight-charts) | `pnpm chart:lightweight` | TradingView Lightweight Charts 4 — OHLC + volume, synced time scales. |
| [Apache ECharts](./examples/charts/echarts) | `pnpm chart:echarts` | ECharts 5 — candlestick + volume in linked grids with dataZoom. |
| [Chart.js financial](./examples/charts/chartjs) | `pnpm chart:chartjs` | Chart.js 4 + `chartjs-chart-financial` plugin on a time axis. |
| [Plotly.js](./examples/charts/plotly) | `pnpm chart:plotly` | Plotly candlestick trace + volume bars with a rangeslider. |
| [Highcharts Stock](./examples/charts/highcharts-stock) | `pnpm chart:highcharts` | Highcharts Stock with range selector. **Commercial license required for production.** |
| [Options chain monitor](./examples/options_chain_monitor) | `pnpm monitor AAPL 2026-06-19` | Live terminal table that highlights bid/ask/last deltas between polls. |

Each chart script fetches one year of daily candles for AAPL through the SDK and writes a self-contained HTML file next to the script that loads the chart library from a public CDN — no bundler, no install per library. Run from the `examples/` directory:

```bash
cd examples
pnpm install
pnpm chart:lightweight   # or any other script above
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
console.log(humanPrices[0].Symbol);  // 'AAPL'
console.log(humanPrices[0].Mid);     // 150.25

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
console.log(humanCandles[0].Date);   // Timestamp
console.log(humanCandles[0].Open);   // Opening price
console.log(humanCandles[0].Close);  // Closing price
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

Every method returns a `Promise` that resolves with the response or rejects with a `MarketDataClientError`. Use ordinary `try`/`catch` with `await`:

```typescript
import {
  MarketDataClient,
  MarketDataClientError,
  RateLimitError,
  RequestError,
  ValidationError,
} from 'marketdata-sdk';

try {
  const prices = await client.stocks.prices('AAPL');
  console.log(prices[0].mid);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof RequestError) {
    console.error('Request failed after retries:', error.message);
  } else if (error instanceof MarketDataClientError) {
    console.error('SDK error:', error.message);
  } else {
    throw error;
  }
}
```

### Error classes

All SDK errors extend `MarketDataClientError`:

- `ValidationError` — request parameters failed Zod validation, or the server response failed schema validation.
- `RateLimitError` — pre-flight credit check or 429 from the server.
- `RequestError` — transport / HTTP failure (e.g. 5xx after retries exhausted).

### Chainable `.save()` / `.blob()`

Every returned Promise also supports chained CSV/JSON helpers. No intermediate `await` is required:

```typescript
// Save directly to disk
const path = await client.stocks.prices('AAPL', { format: 'csv' }).save('aapl.csv');

// Or get a Blob
const blob = await client.stocks.prices('AAPL', { format: 'csv' }).blob();
```

Both helpers throw `MarketDataClientError` on request failure, same as a plain `await`.

### Result-style error handling (opt-in)

If you prefer explicit error values over exceptions (e.g. for functional composition), wrap any call in the pattern of your choice:

```typescript
import { ResultAsync } from 'neverthrow';

const result = await ResultAsync.fromPromise(
  client.stocks.prices('AAPL'),
  (err) => err as MarketDataClientError,
);

result.match(
  (prices) => console.log(prices),
  (err) => console.error(err.message),
);
```

For architectural background on the public API contract, see [ADR-007: Result Inside, Promise Outside](docs/adr/ADR-007-result-inside-promise-outside.md).


## License

MIT

## Links

- [MarketData API Documentation](https://www.marketdata.app/docs)
- [npm Package](https://www.npmjs.com/package/marketdata-sdk)
- [GitHub Repository](https://github.com/MarketDataApp/sdk-js)
