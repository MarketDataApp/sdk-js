# Stocks Resource

The `stocks` resource provides access to stock market data, including real-time prices and historical candles (OHLCV data).

## Accessing the Stocks Resource

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();
```

All methods in the stocks resource include API status checking and automatic retry logic. See [ADR-003](adr/ADR-003-retry-logic-and-service-status.md) for details on retry mechanism and [ADR-004](adr/ADR-004-rate-limiting-strategy.md) for rate limiting.

## Methods

### `prices()`

Fetches stock prices for one or more symbols. This method includes API status checking and automatic retry logic.

#### Function Overloads

```typescript
// Overload 1: Positional symbols parameter
prices<P extends Omit<StocksPricesParams, 'symbols'> & MarketDataParams>(
  symbols: string | string[],
  params?: P
): TypedPromise<StockPriceResponse, StockPriceHumanResponse, P & { symbols: string | string[] }>

// Overload 2: Object parameter
prices<P extends StocksPricesParams & MarketDataParams>(
  params: P
): TypedPromise<StockPriceResponse, StockPriceHumanResponse, P>
```

#### Parameters

**For Overload 1** (positional):
- `symbols`: `string | string[]` - A single stock symbol (e.g., `'AAPL'`) or an array of symbols (e.g., `['AAPL', 'GOOGL', 'MSFT']`)
- `params`: `MarketDataParams` (optional) - Additional parameters:
  - `format`: `'internal' | 'json'` (optional, default: `'internal'`) - Output format
  - `human`: `boolean` (optional, default: `false`) - Use human-readable field names

**For Overload 2** (object):
- `params`: `StocksPricesParams & MarketDataParams` - Object containing:
  - `symbols`: `string | string[]` (required) - Stock symbols
  - `format`: `'internal' | 'json'` (optional, default: `'internal'`)
  - `human`: `boolean` (optional, default: `false`)

#### Return Type

The return type is automatically inferred based on the `format` and `human` parameters:

- If `format: 'json'`: `Promise<unknown>` - Raw JSON response from API
- If `human: true`: `Promise<StockPriceHumanResponse>` - Human-readable format:
  - `Symbol`: `string[]` - Stock symbols
  - `Mid`: `number[]` - Mid prices
  - `Change $`: `number[]` - Price changes in dollars
  - `Change %`: `number[]` - Price changes in percentage
  - `Date`: `number[]` - Timestamps
- Otherwise: `Promise<StockPriceResponse>` - Machine-readable format:
  - `symbol`: `string[]` - Stock symbols
  - `mid`: `number[]` - Mid prices
  - `change`: `number[]` - Price changes
  - `changepct`: `number[]` - Price change percentages
  - `updated`: `number[]` - Timestamps

> **Note:** All responses include an optional `s` field indicating status (`'ok'` for successful requests).

#### Examples

**Get prices for a single symbol:**

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();
const prices = await client.stocks.prices('AAPL');
console.log(prices);
```

**Get prices for multiple symbols:**

```typescript
const prices = await client.stocks.prices(['AAPL', 'GOOGL', 'MSFT']);
console.log(prices);
```

**Get prices in human-readable format:**

```typescript
const prices = await client.stocks.prices('AAPL', { human: true });
console.log(prices.Symbol);
console.log(prices.Mid);
console.log(prices['Change $']);
console.log(prices['Change %']);
```

**Get raw JSON response:**

```typescript
const json = await client.stocks.prices('AAPL', { format: 'json' });
console.log(json);
```

---

### `candles()`

Fetches stock candles (OHLCV data) for a symbol with support for various timeframes and date ranges. This method includes API status checking and automatic retry logic.

**Special Feature:** For intraday resolutions (minutely/hourly) with large date ranges, the SDK automatically splits the range into year-long chunks and fetches them concurrently (up to 50 requests) using `p-limit`, then merges the results.

#### Function Overloads

```typescript
// Overload 1: Positional symbol parameter
candles<P extends Omit<StocksCandlesParams, 'symbol'> & MarketDataParams>(
  symbol: string,
  params?: P
): TypedPromise<StockCandleResponse, StockCandleHumanResponse, P & { symbol: string }>

// Overload 2: Object parameter
candles<P extends StocksCandlesParams & MarketDataParams>(
  params: P
): TypedPromise<StockCandleResponse, StockCandleHumanResponse, P>
```

#### Parameters

**For Overload 1** (positional):
- `symbol`: `string` - A single stock symbol (e.g., `'AAPL'`)
- `params`: `StocksCandlesParams & MarketDataParams` (optional) - Additional parameters

**For Overload 2** (object):
- `params`: `StocksCandlesParams & MarketDataParams` - Object containing:
  - `symbol`: `string` (required) - Stock symbol
  - `resolution`: `string` (optional, default: `'D'`) - Timeframe resolution:
    - Minutely: `'1'`, `'5'`, `'15'`, `'30'`, `'minutely'`
    - Hourly: `'H'`, `'1H'`, `'hourly'`
    - Daily: `'D'`, `'daily'`
    - Weekly: `'W'`, `'weekly'`
    - Monthly: `'M'`, `'monthly'`
    - Yearly: `'Y'`, `'yearly'`
  - `from`: `Date | string` (optional) - Start date for the candles
  - `to`: `Date | string` (optional) - End date for the candles
  - `countback`: `number` (optional) - Number of candles to fetch (alternative to date range)
  - `extended`: `boolean` (optional) - Include extended hours data
  - `adjustsplits`: `boolean` (optional) - Adjust for stock splits
  - `format`: `'internal' | 'json'` (optional, default: `'internal'`)
  - `human`: `boolean` (optional, default: `false`)

#### Date Range Splitting

When both `from` and `to` are provided:
- **For intraday resolutions** (minutely, hourly): The date range is automatically split into year-long chunks
- **Concurrent fetching**: Up to 50 concurrent requests are made using `p-limit`
- **Automatic merging**: Responses are merged into a single structure
- **For non-intraday resolutions** (daily, weekly, monthly, yearly): Single request, no splitting

#### Return Type

The return type is automatically inferred based on the `format` and `human` parameters:

- If `format: 'json'`: `Promise<unknown>` - Raw JSON response
- If `human: true`: `Promise<StockCandleHumanResponse>` - Human-readable format:
  - `Date`: `number[]` - Timestamps
  - `Open`: `number[]` - Opening prices
  - `High`: `number[]` - High prices
  - `Low`: `number[]` - Low prices
  - `Close`: `number[]` - Closing prices
  - `Volume`: `number[]` - Trading volumes
- Otherwise: `Promise<StockCandleResponse>` - Machine-readable format:
  - `t`: `number[]` - Timestamps
  - `o`: `number[]` - Opening prices
  - `h`: `number[]` - High prices
  - `l`: `number[]` - Low prices
  - `c`: `number[]` - Closing prices
  - `v`: `number[]` - Trading volumes

#### Examples

**Get daily candles:**

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();
const candles = await client.stocks.candles('AAPL');
console.log(candles);
```

**Get candles with specific resolution:**

```typescript
const hourly = await client.stocks.candles('AAPL', { resolution: '1H' });
const minute15 = await client.stocks.candles('AAPL', { resolution: '15' });
const weekly = await client.stocks.candles('AAPL', { resolution: 'W' });
```

**Get candles for a date range:**

```typescript
const candles = await client.stocks.candles('AAPL', {
  resolution: '1H',
  from: new Date('2023-01-01'),
  to: new Date('2024-12-31')
});
console.log(candles);
```

**Get candles using countback:**

```typescript
const candles = await client.stocks.candles('AAPL', { countback: 100 });
console.log(candles);
```

**Get candles in human-readable format:**

```typescript
const candles = await client.stocks.candles('AAPL', { human: true });
console.log(candles.Date);
console.log(candles.Open);
console.log(candles.Close);
console.log(candles.Volume);
```

**Get extended hours candles with split adjustment:**

```typescript
const candles = await client.stocks.candles('AAPL', {
  resolution: 'D',
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31'),
  extended: true,
  adjustsplits: true
});
```

## Type Safety

All methods use TypeScript's advanced type system with:
- **Function overloads** for flexible calling patterns
- **Conditional types** (`TypedPromise`) for automatic return type inference
- **Zod schema validation** for runtime type safety
- **Discriminated unions** for `format` and `human` parameters

See [ADR-005](adr/ADR-005-typescript-type-system.md) for detailed explanation of the type system and [ADR-007](adr/ADR-007-result-inside-promise-outside.md) for the Promise-outside boundary.

## Error Handling

Methods return a `MarketDataPromise<T>` that rejects with a subclass of `MarketDataClientError`:

- `AuthenticationError` — 401
- `BadRequestError` — 400
- `NotFoundError` — 404 (not thrown by default; 404 resolves to empty with `no_data: true`)
- `RateLimitError` — 429
- `ServerError` — 5xx (retriable with exponential backoff)
- `NetworkError` — transport failure or 99s timeout
- `ParseError` — response failed schema validation
- `ValidationError` — client-side input validation

```typescript
import { MarketDataClient, AuthenticationError } from 'marketdata-sdk';

const client = new MarketDataClient();
try {
  const prices = await client.stocks.prices('AAPL');
  console.log(prices);
} catch (err) {
  if (err instanceof AuthenticationError) console.error('Bad token');
  else throw err;
}
```

Every error carries `request_id` (cf-ray), `status_code`, `request_url`, `timestamp`, and a formatted `support_info` string. See [ADR-003](adr/ADR-003-retry-logic-and-service-status.md) for the retry logic.

## Rate Limiting

The SDK automatically tracks and enforces rate limits. The eager `/user/` call in the constructor populates `client.rateLimits` before any resource call — await `client.ready` if you need a synchronous guarantee:

```typescript
const client = new MarketDataClient({ token: 'YOUR_TOKEN' });
await client.ready; // populates rateLimits on construction

if (client.rateLimits) {
  console.log(`Limit: ${client.rateLimits.requestsLimit}`);
  console.log(`Remaining: ${client.rateLimits.requestsRemaining}`);
  console.log(`Consumed: ${client.rateLimits.requestsConsumed}`);
  console.log(`Reset at: ${new Date(client.rateLimits.requestsReset * 1000)}`);
}
```

See [ADR-004](adr/ADR-004-rate-limiting-strategy.md) and [ADR-008](adr/ADR-008-eager-startup-validation.md) for the rate-limiting and eager-startup strategies.
