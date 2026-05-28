# Quotes

Retrieve quotes for one or more specific option contracts, including full Greeks.

## Making Requests

Use the `quotes()` method on the `options` resource to fetch quotes for individual option contracts identified by their OCC symbol. When multiple symbols are provided, the SDK fans out concurrently and merges the results.

| Output Format          | Result Payload                              | Description                                       |
|------------------------|---------------------------------------------|---------------------------------------------------|
| **internal** (default) | `OptionsQuotes[]` or `OptionsQuotesHuman[]` | Array of decoded quote records, one per contract. |
| **json**               | Raw JSON object                             | The compressed, array-keyed response object.      |
| **csv**                | `Blob`                                      | CSV payload. Use `.save(filename)` to write it.   |

<a name="quotes"></a>
## quotes

```typescript
// Positional form
quotes<P>(
  symbols: string | string[],
  params?: P,
): MarketDataPromise<OptionsQuotes[] | OptionsQuotesHuman[]>

// Object form
quotes<P>(
  params: P & { symbols: string | string[] },
): MarketDataPromise<OptionsQuotes[] | OptionsQuotesHuman[]>
```

Fetches quotes for one or more option contracts.

#### Parameters

- `symbols` (string | string[])

  A single OCC-format option symbol (e.g. `"AAPL271217C00250000"`) or an array of symbols. When you pass an array, the SDK fetches each contract concurrently and merges the results.

- [`outputFormat`](../settings.md#output-format) (optional): The format of the returned data. Alias: `format`.
- [`dateFormat`](../settings.md#date-format) (optional): Date format. Alias: `dateformat`.
- [`columns`](../settings.md#columns) (optional): Columns to include.
- [`addHeaders`](../settings.md#headers) (optional): Whether to include headers in CSV output. Alias: `headers`.
- [`useHumanReadable`](../settings.md#human-readable) (optional): Use human-readable field names. Alias: `human`.
- [`mode`](../settings.md#data-mode) (optional): The data mode to use.

Additional endpoint-specific parameters like `from`, `to`, and `date` are passed through to the REST API. See [REST API Options Quotes](https://www.marketdata.app/docs/api/options/quotes) for the full list.

#### Returns

- [`MarketDataPromise<OptionsQuotes[] | OptionsQuotesHuman[] | Blob>`](../client.md#MarketDataPromise)

### Single Contract

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  const quotes = await client.options.quotes("AAPL271217C00250000");
  const q = quotes[0];
  console.log(
    `${q.optionSymbol}: bid=${q.bid} ask=${q.ask} delta=${q.delta}`
  );
} catch (error) {
  console.error(error);
}
```

### Multiple Contracts

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();

try {
  const quotes = await client.options.quotes([
    "AAPL271217C00250000",
    "AAPL271217P00250000",
    "AAPL271217C00300000",
  ]);
  for (const q of quotes) {
    console.log(`${q.optionSymbol}: mid=${q.mid}`);
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
  const quotes = await client.options.quotes("AAPL271217C00250000", {
    human: true,
  });
  console.log(quotes[0]);
} catch (error) {
  console.error(error);
}
```

<a name="OptionsQuotes"></a>
## OptionsQuotes

`OptionsQuotes` uses the same field shape as [`OptionsChain`](./chain.md#OptionsChain): `optionSymbol`, `underlying`, `expiration`, `side`, `strike`, `bid`, `ask`, `mid`, `last`, `openInterest`, `volume`, `inTheMoney`, `intrinsicValue`, `extrinsicValue`, `iv`, `delta`, `gamma`, `theta`, `vega`, and so on.

See [OptionsChain](./chain.md#OptionsChain) for the complete list of fields.

<a name="OptionsQuotesHuman"></a>
## OptionsQuotesHuman

`OptionsQuotesHuman` is returned when `human: true` is set. Field shape mirrors [`OptionsChainHuman`](./chain.md#OptionsChainHuman) — same columns, `Title_Case` names.
