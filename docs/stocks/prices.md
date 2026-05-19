# Prices

Retrieve stock prices for any supported stock symbol.

## Making Requests

Use the `prices()` method on the `stocks` resource to fetch stock prices. The method returns a [`MarketDataResult`](../client.md#MarketDataResult) which resolves to decoded records by default. The output format is controlled by the `outputFormat` parameter (or `MARKETDATA_OUTPUT_FORMAT` env var):

| Output Format          | Result Payload                        | Description                                                           |
|------------------------|---------------------------------------|-----------------------------------------------------------------------|
| **internal** (default) | `StockPrice[]` or `StockPriceHuman[]` | Array of decoded price records, one per symbol.                       |
| **json**               | Raw JSON object                       | The compressed, array-keyed response object as returned by the API.   |
| **csv**                | `Blob`                                | CSV payload. Use `.save(filename)` on the result to write it to disk. |

<a name="prices"></a>
## prices

```typescript
// Positional form
prices<P>(
  symbols: string | string[],
  params?: P,
): MarketDataResult<StockPrice[] | StockPriceHuman[]>

// Object form
prices<P>(
  params: P & { symbols: string | string[] },
): MarketDataResult<StockPrice[] | StockPriceHuman[]>
```

Fetches stock prices for one or more symbols. The return type is narrowed automatically:

- If `human: true` (or `useHumanReadable: true`) → payload is `StockPriceHuman[]`
- If `outputFormat: "csv"` → payload is `Blob`
- Otherwise → payload is `StockPrice[]`

#### Parameters

- `symbols` (string | string[])

  A single symbol string or an array of symbol strings for which to fetch prices.

- [`outputFormat`](../settings.md#output-format) (optional)

  The format of the returned data. See [Settings](../settings.md#output-format) for details. Also accepts the alias `format`.

- [`dateFormat`](../settings.md#date-format) (optional)

  The date format to use in the response. Also accepts the alias `dateformat`. See [Settings](../settings.md#date-format) for details.

- [`columns`](../settings.md#columns) (optional)

  Specify which columns to include in the response. See [Settings](../settings.md#columns) for details.

- [`addHeaders`](../settings.md#headers) (optional)

  Whether to include headers in CSV output. Also accepts the alias `headers`. See [Settings](../settings.md#headers) for details.

- [`useHumanReadable`](../settings.md#human-readable) (optional)

  Whether to use human-readable field names. Also accepts the alias `human`. See [Settings](../settings.md#human-readable) for details.

- [`mode`](../settings.md#data-mode) (optional)

  The data mode to use (`"live"`, `"cached"`, `"delayed"`). See [Settings](../settings.md#data-mode) for details.

#### Returns

- [`MarketDataResult<StockPrice[] | StockPriceHuman[] | Blob>`](../client.md#MarketDataResult)

  A Result wrapping the prices data in the requested format. Handle success and failure with `.match()`, `.isOk()` / `.isErr()`, or any other neverthrow method.

### Single Symbol

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.prices("AAPL");

result.match(
  (prices) => console.log(prices[0].mid),
  (error) => console.error(error.message),
);
```

### Multiple Symbols

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.prices(["AAPL", "MSFT", "GOOGL"]);

result.match(
  (prices) => {
    for (const p of prices) {
      console.log(`${p.symbol}: ${p.mid}`);
    }
  },
  (error) => console.error(error.message),
);
```

### Human Readable

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.prices("AAPL", { human: true });

result.match(
  (prices) => {
    for (const p of prices) {
      console.log(`${p.Symbol}: mid=${p.Mid}, change=${p.Change_Percent}`);
    }
  },
  (error) => console.error(error.message),
);
```

### Raw JSON

```typescript
import { MarketDataClient, OutputFormat } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.prices(["AAPL", "MSFT"], {
  outputFormat: OutputFormat.JSON,
});

result.match(
  (json) => console.log(json),
  (error) => console.error(error.message),
);
```

### CSV

```typescript
import { MarketDataClient, OutputFormat } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.prices(["AAPL", "MSFT"], {
  outputFormat: OutputFormat.CSV,
});

// Save the Blob to disk (Node.js)
const filename = await result.save("prices.csv");
console.log(`CSV saved to: ${filename}`);
```

<a name="StockPrice"></a>
## StockPrice

```typescript
interface StockPrice {
  s?: string;
  symbol: string;
  mid: number;
  change: number;
  changepct: number;
  updated: number;
}
```

`StockPrice` represents a single stock price, with short machine-readable field names.

#### Properties

- `s` (string, optional): Status indicator (`"ok"` for successful responses).
- `symbol` (string): The stock symbol.
- `mid` (number): The mid price calculated between the ask and bid.
- `change` (number): The price change.
- `changepct` (number): The fractional price change (e.g. `0.0124` for +1.24%).
- `updated` (number): Unix timestamp when the price was last updated.

<a name="StockPriceHuman"></a>
## StockPriceHuman

```typescript
interface StockPriceHuman {
  s?: string;
  Symbol: string;
  Mid: number;
  Change_Price: number;
  Change_Percent: number;
  Date: number;
}
```

`StockPriceHuman` represents a stock price in human-readable format with capitalized, snake-case field names. Returned when `human: true` (or `useHumanReadable: true`) is set.

#### Properties

- `Symbol` (string): The stock symbol.
- `Mid` (number): The mid price.
- `Change_Price` (number): The price change.
- `Change_Percent` (number): The percent change.
- `Date` (number): Unix timestamp of the update.
