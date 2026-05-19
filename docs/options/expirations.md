# Expirations

Retrieve the list of current or historical option expiration dates for a given underlying symbol.

## Making Requests

Use the `expirations()` method on the `options` resource to fetch available expiration dates.

| Output Format          | Result Payload                                                    | Description                              |
|------------------------|-------------------------------------------------------------------|------------------------------------------|
| **internal** (default) | `OptionsExpirationsResponse` or `OptionsExpirationsHumanResponse` | Object with the list of expirations.     |
| **json**               | Raw JSON object                                                   | The raw response as returned by the API. |

<a name="expirations"></a>
## expirations

```typescript
// Positional form
expirations<P>(
  symbol: string,
  params?: P,
): MarketDataResult<OptionsExpirationsResponse | OptionsExpirationsHumanResponse>

// Object form
expirations<P>(
  params: P & { symbol: string },
): MarketDataResult<OptionsExpirationsResponse | OptionsExpirationsHumanResponse>
```

Fetches the list of expirations for a single underlying symbol.

#### Parameters

- `symbol` (string)

  The underlying stock symbol.

- `strike` (number, optional)

  Filter to expirations that have at least one contract at the given strike.

- `date` (string | Date, optional)

  Fetch expirations as-of a specific historical date.

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.

#### Returns

- [`MarketDataResult<OptionsExpirationsResponse | OptionsExpirationsHumanResponse>`](../client.md#MarketDataResult)

### Default

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.options.expirations("AAPL");

result.match(
  (data) => {
    console.log(`Updated: ${data.updated}`);
    for (const exp of data.expirations) {
      console.log(exp);
    }
  },
  (error) => console.error(error.message),
);
```

### Filter By Strike

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

// Only expirations that trade the $250 strike
const result = await client.options.expirations("AAPL", { strike: 250 });

result.match(
  (data) => console.log(data.expirations),
  (error) => console.error(error.message),
);
```

### Human Readable

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.options.expirations("AAPL", { human: true });

result.match(
  (data) => console.log(data.Expirations),
  (error) => console.error(error.message),
);
```

<a name="OptionsExpirationsResponse"></a>
## OptionsExpirationsResponse

```typescript
interface OptionsExpirationsResponse {
  s: string;
  expirations: string[];
  updated: number;
}
```

#### Properties

- `s` (string): Status indicator.
- `expirations` (string[]): List of expiration dates in `YYYY-MM-DD` format.
- `updated` (number): Unix timestamp when the data was last updated.

<a name="OptionsExpirationsHumanResponse"></a>
## OptionsExpirationsHumanResponse

```typescript
interface OptionsExpirationsHumanResponse {
  s?: string;
  Expirations: string[];
  Date: number;
}
```

`OptionsExpirationsHumanResponse` is returned when `human: true` is set.
