# Options Resource

Access options market data: full chain snapshots with Greeks, per-contract quotes, expiration lists, option-symbol lookup, and strike enumeration.

```typescript
import { MarketDataClient } from "marketdata-sdk";

const client = new MarketDataClient();
await client.ready; // fail-fast on invalid tokens
```

All methods return a `MarketDataPromise<T>` that resolves with the decoded rows. Errors reject with a subclass of `MarketDataClientError` — see [client docs](../README.md#error-handling).

## Methods

### `chain(underlying, params?)`

Fetches an end-of-day options chain with full Greeks for an underlying symbol.

```typescript
const rows = await client.options.chain("AAPL", {
  expiration: "2026-06-19",
  side: "call",
});

for (const r of rows) {
  console.log(r.optionSymbol, r.strike, r.bid, r.ask, r.delta, r.iv);
}
```

Common parameters (see `src/resources/options/types.ts` for the full shape):

- `expiration`: single date, `"all"`, or a filter keyword. Narrow the result set before Greeks are computed — it cuts response size dramatically.
- `side`: `"call"` / `"put"`.
- `strike`, `strikeLimit`, `from`, `to`, `date`: standard filtering knobs.
- `minVolume`, `minOpenInterest`, `minBidAskSpread`, `minLiquidity`: premium-plan liquidity filters.
- `human`: `true` to receive `"Option Symbol"`, `"Bid Price"`-style keys instead of `optionSymbol`/`bid`.

Returns `OptionsChainRow[]` (or `OptionsChainHumanRow[]` when `human: true`).

### `quotes(symbols, params?)`

Fetches current quotes for one or more option contracts. Array fan-out runs through the client's 50-request concurrency pool.

```typescript
const rows = await client.options.quotes([
  "AAPL250620C00150000",
  "AAPL250620P00150000",
]);

for (const r of rows) {
  console.log(r.optionSymbol, r.mid, r.volume);
}
```

Accepts a single symbol or an array. Per-request params mirror `chain`. Use `from`/`to` for historical quotes on premium plans.

### `expirations(underlying, params?)`

Returns the list of available expiration dates for an underlying.

```typescript
const result = await client.options.expirations("AAPL");
console.log(result.expirations); // ["2025-12-05", "2025-12-12", …]
```

Pass `date` to pin the snapshot date, or `strike` to narrow to expirations that list a given strike.

### `lookup(userInput)`

Converts a human-readable description into a canonical OCC option symbol.

```typescript
const { optionSymbol } = await client.options.lookup(
  "AAPL 7/28/2023 200 Call",
);
// "AAPL230728C00200000"
```

### `strikes(underlying, params?)`

Enumerates strikes trading for a given expiration.

```typescript
const res = await client.options.strikes("AAPL", {
  expiration: "2026-06-19",
});
console.log(res["2026-06-19"]); // number[]
```

## Output formats

All methods accept the universal `outputFormat` / `format` parameter:

- `"internal"` (default): decoded row objects — best for typical code.
- `"json"`: raw compressed, array-keyed JSON straight from the API.
- `"csv"`: `Blob` containing the server's CSV output. Chain calls with many expirations are large — stream to disk with `.saveToFile(path)`.

```typescript
const path = await client.options
  .chain("AAPL", { expiration: "2026-06-19", outputFormat: "csv" })
  .saveToFile("aapl-chain.csv");
console.log("wrote", path);
```

## No-data responses

A 404 response (for example, a future expiration on a symbol with no listings) resolves rather than rejecting. Check `no_data` or `hasData()` on the returned promise:

```typescript
const pending = client.options.expirations("UNKNOWN_TICKER");
const res = await pending;
if (pending.no_data) {
  console.log("No expirations for that symbol");
}
```

## Further reading

- Universal parameters: `dateformat`, `columns`, `headers`, `human` — see the [settings docs](../README.md#settings-and-environment-variables).
- Full parameter schemas are the source of truth in `src/resources/options/types.ts`; the editor's autocomplete surfaces them at the call site.
- Endpoint reference on the REST docs: [options chain](https://www.marketdata.app/docs/api/options/chain), [quotes](https://www.marketdata.app/docs/api/options/quotes), [expirations](https://www.marketdata.app/docs/api/options/expirations), [lookup](https://www.marketdata.app/docs/api/options/lookup), [strikes](https://www.marketdata.app/docs/api/options/strikes).
