# marketdata-sdk examples

Runnable snippets showing typical integrations. These are not part of the published SDK; they live here so that contributors have end-to-end working references.

```bash
cd examples
pnpm install
```

## Available examples

| Script | Command | What it does |
|---|---|---|
| [`stock_candles_example`](./stock_candles_example/index.ts) | `pnpm candles` | Fetches a year of AAPL daily candles, writes `candles.csv` and a self-contained `candles.html` chart, then opens the chart in your browser. |
| [`options_chain_monitor`](./options_chain_monitor/index.ts) | `pnpm monitor AAPL 2026-06-19` | Polls the options chain for an underlying + expiration on an interval, diffs each row, and colours up/down moves in a live terminal table. |

Most examples run against the free `AAPL` token tier; set `MARKETDATA_TOKEN` in a root-level `.env` file or in your shell if you want authenticated endpoints.
