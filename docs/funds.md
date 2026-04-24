# Funds Resource

Historical daily candles for mutual funds and ETFs.

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();
await client.ready;
```

## Methods

### `candles(symbol, params?)`

Fetches OHLCV candles for a fund symbol. Daily resolution only.

```typescript
const rows = await client.funds.candles("VFINX", {
  from: "2024-01-01",
  to: "2024-12-31",
});

for (const r of rows) {
  console.log(r.t, r.o, r.h, r.l, r.c, r.v);
}
```

Parameters:

- `resolution` (optional, default `"D"`): only daily is accepted for funds.
- `from`, `to`, `date`: bound the window. `countback` is an alternative to `from` for "the last N bars."
- `human`: emit `"Open"`, `"Close"`, `"Volume"`-style keys.
- `outputFormat`: `"internal"` (default), `"json"`, or `"csv"`.

`VFINX` is available without a token (demo mode). Other symbols require an authenticated token.

## Output formats

Identical to the stocks/options resources. For CSV:

```typescript
await client.funds
  .candles("VFINX", { from: "2024-01-01", to: "2024-12-31", outputFormat: "csv" })
  .saveToFile("vfinx-2024.csv");
```

## Further reading

- Parameter schema: `src/resources/funds/types.ts`.
- REST endpoint reference: [funds candles](https://www.marketdata.app/docs/api/funds/candles).
