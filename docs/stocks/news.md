# News

Retrieve news articles for any supported stock symbol.

## Making Requests

Use the `news()` method on the `stocks` resource to fetch news.

| Output Format          | Result Payload                      | Description                                     |
|------------------------|-------------------------------------|-------------------------------------------------|
| **internal** (default) | `StockNews[]` or `StockNewsHuman[]` | Array of decoded news articles.                 |
| **json**               | Raw JSON object                     | The compressed, array-keyed response object.    |
| **csv**                | `Blob`                              | CSV payload. Use `.save(filename)` to write it. |

<a name="news"></a>
## news

```typescript
// Positional form
news<P>(
  symbol: string,
  params?: P,
): MarketDataResult<StockNews[] | StockNewsHuman[]>

// Object form
news<P>(
  params: P & { symbol: string },
): MarketDataResult<StockNews[] | StockNewsHuman[]>
```

Fetches news articles for a single symbol.

#### Parameters

- `symbol` (string)

  The stock symbol to fetch news for.

- `from` (string | Date, optional)

  Start of the date range for news articles.

- `to` (string | Date, optional)

  End of the date range for news articles.

- `date` (string | Date, optional)

  Fetch news for a specific date.

- `countback` (number, optional)

  Number of articles to return, counting backwards from `to`.

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`addHeaders`](../settings.md#headers) (optional): Whether to include headers in CSV output. Alias: `headers`.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.
- [`mode`](../settings.md#data-mode) (optional): The data mode to use.

#### Returns

- [`MarketDataResult<StockNews[] | StockNewsHuman[] | Blob>`](../client.md#MarketDataResult)

### Default

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.news("AAPL");

result.match(
  (articles) => {
    for (const a of articles) {
      console.log(`${a.source}: ${a.headline}`);
    }
  },
  (error) => console.error(error.message),
);
```

### Date Range

```typescript
import { MarketDataClient } from "marketdata-sdk-js";

const client = new MarketDataClient();

const result = await client.stocks.news("AAPL", {
  from: "2024-01-01",
  to: "2024-01-31",
});

result.match(
  (articles) => console.log(`Got ${articles.length} articles`),
  (error) => console.error(error.message),
);
```

<a name="StockNews"></a>
## StockNews

```typescript
interface StockNews {
  s?: string;
  symbol: string;
  headline: string;
  content: string;
  source: string;
  publicationDate: number;
}
```

#### Properties

- `symbol` (string): The stock symbol.
- `headline` (string): The news headline.
- `content` (string): The article content or summary.
- `source` (string): The news source publisher.
- `publicationDate` (number): Unix timestamp when the article was published.

<a name="StockNewsHuman"></a>
## StockNewsHuman

`StockNewsHuman` is returned when `human: true` is set. It uses the same field names as `StockNews` for most columns, but with `Symbol` capitalized.
