# Candles

Retrieve historical OHLCV (open/high/low/close/volume) candles for any supported stock symbol.

## Making Requests

Use the `candles()` method on the `stocks` resource to fetch candles. The method handles large intraday date ranges automatically by splitting them into year-sized chunks and fetching them concurrently (up to 50 in-flight at once), then merging the results.

| Output Format          | Result Payload                          | Description                                     |
|------------------------|-----------------------------------------|-------------------------------------------------|
| **internal** (default) | `StockCandle[]` or `StockCandleHuman[]` | Array of decoded candle records, one per bar.   |
| **json**               | Raw JSON object                         | The compressed, array-keyed response object.    |
| **csv**                | `Blob`                                  | CSV payload. Use `.save(filename)` to write it. |

<a name="candles"></a>
## candles

```typescript
// Positional form
candles<P>(
  symbol: string,
  params?: P,
): MarketDataPromise<StockCandle[] | StockCandleHuman[]>

// Object form
candles<P>(
  params: P & { symbol: string },
): MarketDataPromise<StockCandle[] | StockCandleHuman[]>
```

Fetches historical candles for a single symbol.

#### Parameters

- `symbol` (string)

  The stock symbol to fetch candles for.

- `resolution` (string, optional, default `"D"`)

  The candle resolution. Common values:
  - Minute-based: `"1"`, `"5"`, `"15"`, `"30"`, `"45"`, `"minutely"`
  - Hour-based: `"H"`, `"1H"`, `"2H"`, `"hourly"`
  - Day-and-up: `"D"`, `"daily"`, `"W"`, `"weekly"`, `"M"`, `"monthly"`, `"Y"`, `"yearly"`

- `from` (string | Date, optional)

  Start of the date range. Accepts ISO strings, Unix seconds as a string, or a `Date`.

- `to` (string | Date, optional)

  End of the date range. Accepts ISO strings, Unix seconds as a string, or a `Date`.

- `countback` (number, optional)

  Fetch `N` candles before `to` (mutually exclusive with `from`).

- `extended` (boolean, optional)

  Include extended-hours data for intraday resolutions.

- `adjustsplits` (boolean, optional)

  Adjust historical prices for splits.

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format for response timestamps. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`addHeaders`](../settings.md#headers) (optional): Whether to include headers in CSV output. Alias: `headers`.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.
- [`mode`](../settings.md#data-mode) (optional): The data mode to use.

#### Returns

- [`MarketDataPromise<StockCandle[] | StockCandleHuman[] | Blob>`](../client.md#MarketDataPromise)

#### Notes

- For intraday resolutions (minute- or hour-based), date ranges longer than 365 days are split into yearly chunks and fetched concurrently. The individual responses are merged back into a single chronologically ordered result.
- Up to 50 chunks can be in flight simultaneously (sliding window, not batching).

### Daily Candles

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  // Default resolution is "D" (daily)
  const candles = await client.stocks.candles("AAPL", { countback: 30 });
  for (const c of candles) {
    console.log(`t=${c.t} o=${c.o} h=${c.h} l=${c.l} c=${c.c} v=${c.v}`);
  }
} catch (error) {
  console.error(error);
}
```

### Intraday Range

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  // Hourly candles over a multi-year range.
  // The SDK automatically splits into year-sized chunks
  // and fetches them concurrently.
  const candles = await client.stocks.candles("AAPL", {
    resolution: "1H",
    from: new Date("2023-01-01"),
    to: new Date("2024-12-31"),
  });
  console.log(`Got ${candles.length} bars`);
} catch (error) {
  console.error(error);
}
```

### Human Readable

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  const candles = await client.stocks.candles("AAPL", {
    resolution: "D",
    countback: 10,
    human: true,
  });
  for (const c of candles) {
    console.log(`Date=${c.Date} Open=${c.Open} Close=${c.Close}`);
  }
} catch (error) {
  console.error(error);
}
```

### CSV

```typescript
import { MarketDataClient, OutputFormat } from "marketdata-sdk";

const client = new MarketDataClient();

const csv = await client.stocks.candles("AAPL", {
  resolution: "D",
  countback: 100,
  outputFormat: OutputFormat.CSV,
});

const filename = await csv.save("aapl_daily.csv");
console.log(`CSV saved to: ${filename}`);
```

<a name="StockCandle"></a>
## StockCandle

```typescript
interface StockCandle {
  s?: string;
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}
```

`StockCandle` uses the API's short, machine-readable field names.

#### Properties

- `s` (string, optional): Status indicator.
- `t` (number): Unix timestamp of the bar.
- `o` (number): Opening price.
- `h` (number): High price.
- `l` (number): Low price.
- `c` (number): Closing price.
- `v` (number): Volume.

<a name="StockCandleHuman"></a>
## StockCandleHuman

```typescript
interface StockCandleHuman {
  s?: string;
  Date: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}
```

`StockCandleHuman` is returned when `human: true` is set.
