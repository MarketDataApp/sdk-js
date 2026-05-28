# Earnings

Retrieve historical and upcoming earnings information for any supported stock symbol.

## Making Requests

Use the `earnings()` method on the `stocks` resource to fetch earnings data.

| Output Format          | Result Payload                              | Description                                     |
|------------------------|---------------------------------------------|-------------------------------------------------|
| **internal** (default) | `StockEarnings[]` or `StockEarningsHuman[]` | Array of decoded earnings records.              |
| **json**               | Raw JSON object                             | The compressed, array-keyed response object.    |
| **csv**                | `Blob`                                      | CSV payload. Use `.save(filename)` to write it. |

<a name="earnings"></a>
## earnings

```typescript
// Positional form
earnings<P>(
  symbol: string,
  params?: P,
): MarketDataPromise<StockEarnings[] | StockEarningsHuman[]>

// Object form
earnings<P>(
  params: P & { symbol: string },
): MarketDataPromise<StockEarnings[] | StockEarningsHuman[]>
```

Fetches earnings data for a single symbol.

#### Parameters

- `symbol` (string)

  The stock symbol to fetch earnings for.

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format for response timestamps. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`addHeaders`](../settings.md#headers) (optional): Whether to include headers in CSV output. Alias: `headers`.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.
- [`mode`](../settings.md#data-mode) (optional): The data mode to use.

Additional endpoint-specific parameters (e.g. `from`, `to`, `date`) are passed through to the REST API as-is. See the [REST API Earnings documentation](https://www.marketdata.app/docs/api/stocks/earnings) for the complete list.

#### Returns

- [`MarketDataPromise<StockEarnings[] | StockEarningsHuman[] | Blob>`](../client.md#MarketDataPromise)

> [!NOTE]
> Earnings data is a premium endpoint on the Market Data API. Your plan must include earnings access for this method to return data.

### Default

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  const earnings = await client.stocks.earnings("AAPL");
  for (const e of earnings) {
    console.log(
      `FY${e.fiscalYear} Q${e.fiscalQuarter}: ` +
      `reported=${e.reportedEPS} estimated=${e.estimatedEPS}`
    );
  }
} catch (error) {
  console.error(error);
}
```

### Human Readable

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  const earnings = await client.stocks.earnings("AAPL", { human: true });
  for (const e of earnings) {
    console.log(`${e.Symbol} FY${e.Fiscal_Year} Q${e.Fiscal_Quarter}: ${e.Reported_EPS}`);
  }
} catch (error) {
  console.error(error);
}
```

<a name="StockEarnings"></a>
## StockEarnings

```typescript
interface StockEarnings {
  s?: string;
  symbol: string;
  fiscalYear: number;
  fiscalQuarter: number;
  date: number;
  reportDate: number;
  reportTime: string | null;
  currency: string | null;
  reportedEPS: number | null;
  estimatedEPS: number | null;
  surpriseEPS: number | null;
  surpriseEPSpct: number | null;
  updated: number;
}
```

#### Properties

- `symbol` (string): The stock symbol.
- `fiscalYear` (number): The fiscal year of the earnings report.
- `fiscalQuarter` (number): The fiscal quarter (1–4).
- `date` (number): Unix timestamp of the earnings event.
- `reportDate` (number): Unix timestamp when the earnings were reported.
- `reportTime` (string | null): Time of day the earnings were reported (e.g. `"bmo"`, `"amc"`).
- `currency` (string | null): Currency of the EPS figures.
- `reportedEPS` (number | null): The actual reported earnings per share.
- `estimatedEPS` (number | null): The analyst consensus estimate.
- `surpriseEPS` (number | null): The difference between reported and estimated EPS.
- `surpriseEPSpct` (number | null): The surprise as a fraction of the estimate.
- `updated` (number): Unix timestamp when the record was last updated.

<a name="StockEarningsHuman"></a>
## StockEarningsHuman

```typescript
interface StockEarningsHuman {
  s?: string;
  Symbol: string;
  Fiscal_Year: number;
  Fiscal_Quarter: number;
  Date: number;
  Report_Date: number;
  Report_Time: string | null;
  Currency: string | null;
  Reported_EPS: number | null;
  Estimated_EPS: number | null;
  Surprise_EPS: number | null;
  Surprise_EPS_Percent: number | null;
  Updated: number;
}
```

`StockEarningsHuman` is returned when `human: true` is set. Field names use `Title_Case`.
