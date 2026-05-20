# Status

Retrieve market status information (open/closed) for dates and countries.

## Making Requests

Use the `status()` method on the `markets` resource to fetch market status information.

| Output Format          | Result Payload                            | Description                                     |
|------------------------|-------------------------------------------|-------------------------------------------------|
| **internal** (default) | `MarketStatus[]` or `MarketStatusHuman[]` | Array of decoded market-status records.         |
| **json**               | Raw JSON object                           | The compressed, array-keyed response object.    |
| **csv**                | `Blob`                                    | CSV payload. Use `.save(filename)` to write it. |

<a name="status"></a>
## status

```typescript
status<P>(
  params?: P,
): MarketDataResult<MarketStatus[] | MarketStatusHuman[]>
```

Fetches market status information. All parameters are optional.

#### Parameters

- `country` (string, optional)

  Filter by country code (e.g. `"US"`, `"CA"`, `"GB"`).

- `date` (string | Date, optional)

  Specific date to fetch status for.

- `from` (string | Date, optional)

  Start of the date range.

- `to` (string | Date, optional)

  End of the date range.

- `countback` (number, optional)

  Number of days to return, counting backwards from `to` (or the current date if `to` is not provided).

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`addHeaders`](../settings.md#headers) (optional): Whether to include headers in CSV output. Alias: `headers`.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.
- [`mode`](../settings.md#data-mode) (optional): The data mode to use.

#### Returns

- [`MarketDataResult<MarketStatus[] | MarketStatusHuman[] | Blob>`](../client.md#MarketDataResult)

### Today

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.markets.status();

result.match(
  (days) => {
    for (const d of days) {
      console.log(`date=${d.date} status=${d.status}`);
    }
  },
  (error) => console.error(error.message),
);
```

### Date Range

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.markets.status({
  from: "2024-01-01",
  to: "2024-01-31",
  country: "US",
});

result.match(
  (days) => console.log(days),
  (error) => console.error(error.message),
);
```

### Countback

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

// Last 7 trading-status days
const result = await client.markets.status({ countback: 7 });

result.match(
  (days) => console.log(days),
  (error) => console.error(error.message),
);
```

### Human Readable

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.markets.status({ countback: 7, human: true });

result.match(
  (days) => {
    for (const d of days) {
      console.log(`Date=${d.Date} Status=${d.Status}`);
    }
  },
  (error) => console.error(error.message),
);
```

<a name="MarketStatus"></a>
## MarketStatus

```typescript
interface MarketStatus {
  s?: string;
  date: number;
  status: string;
}
```

#### Properties

- `s` (string, optional): Status indicator.
- `date` (number): Unix timestamp of the trading day.
- `status` (string): Market status (e.g. `"open"`, `"closed"`).

<a name="MarketStatusHuman"></a>
## MarketStatusHuman

```typescript
interface MarketStatusHuman {
  s?: string;
  Date: number;
  Status: string;
}
```

`MarketStatusHuman` is returned when `human: true` is set.
