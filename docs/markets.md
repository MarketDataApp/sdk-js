# Markets Resource

The `markets` resource provides access to market status information and availability data.

## Accessing the Markets Resource

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();
```

All methods in the markets resource include API status checking and automatic retry logic. See [ADR-003](adr/ADR-003-retry-logic-and-service-status.md) for details on retry mechanism and [ADR-004](adr/ADR-004-rate-limiting-strategy.md) for rate limiting.

## Methods

### `status()`

Fetches the current status and availability of various markets. This method includes API status checking and automatic retry logic.

#### Function Signature

```typescript
status<P extends MarketStatusParams & MarketDataParams>(
  params?: P
): TypedResult<MarketStatusResponse, MarketStatusHumanResponse, P>
```

#### Parameters

- `params`: `MarketStatusParams & MarketDataParams` (optional) - Object containing:
  - `format`: `'internal' | 'json'` (optional, default: `'internal'`) - Output format
  - `human`: `boolean` (optional, default: `false`) - Use human-readable field names
  - Other universal API parameters (if applicable)

#### Return Type

The return type is automatically inferred based on the `format` and `human` parameters:

- If `format: 'json'`: `Promise<unknown>` - Raw JSON response from API
- If `human: true`: `Promise<MarketStatusHumanResponse>` - Human-readable format with capitalized field names
- Otherwise: `Promise<MarketStatusResponse>` - Machine-readable format with lowercase field names

The response contains information about:
- Market status (open/closed)
- Market availability
- Trading hours
- Market date

> **Note:** All responses include an optional `s` field indicating status (`'ok'` for successful requests).

#### Examples

**Get market status:**

```typescript
import { MarketDataClient } from 'marketdata-sdk';

const client = new MarketDataClient();
const status = await client.markets.status();
console.log(status);
```

**Get market status in human-readable format:**

```typescript
const status = await client.markets.status({ human: true });
console.log(status.Date);
console.log(status.Status);
```

**Get raw JSON response:**

```typescript
const json = await client.markets.status({ format: 'json' });
console.log(json);
```

## Type Safety

The `status()` method uses TypeScript's advanced type system with:
- **Function overloads** for flexible calling patterns
- **Conditional types** (`TypedResult`) for automatic return type inference
- **Zod schema validation** for runtime type safety
- **Discriminated unions** for `format` and `human` parameters

See [ADR-005](adr/ADR-005-typescript-type-system.md) for detailed explanation of the type system.

## Error Handling

The `status()` method can throw:
- `RateLimitError` - When API rate limit is exceeded
- `RequestError` - For retriable HTTP errors (5xx, timeouts)
- `AbortError` - For permanent errors (4xx) or when service is offline

The SDK automatically retries transient errors with exponential backoff. See [ADR-003](adr/ADR-003-retry-logic-and-service-status.md) for details.

## Rate Limiting

The SDK automatically tracks and enforces rate limits. Access current rate limit status via:

```typescript
const client = new MarketDataClient({ token: 'YOUR_TOKEN' });

// Make some requests
await client.markets.status();

// Check rate limits
if (client.rateLimits) {
  console.log(`Limit: ${client.rateLimits.requestsLimit}`);
  console.log(`Remaining: ${client.rateLimits.requestsRemaining}`);
  console.log(`Consumed: ${client.rateLimits.requestsConsumed}`);
  console.log(`Reset at: ${new Date(client.rateLimits.requestsReset * 1000)}`);
}
```

See [ADR-004](adr/ADR-004-rate-limiting-strategy.md) for details on rate limiting strategy.
